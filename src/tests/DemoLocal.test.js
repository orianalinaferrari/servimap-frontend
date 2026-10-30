import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createServer, request } from 'node:http'
import { iniciarDemo } from '../../scripts/qa/demo-local.mjs'
import { crearDemoAdmin } from '../../scripts/qa/admin-datos.mjs'
import { crearDemoCliente } from '../../scripts/qa/cliente-datos.mjs'
import { idQA } from '../../scripts/qa/api-simulada.mjs'

function puertoLibre() {
  return new Promise((resolve, reject) => {
    const servidor = createServer().once('error', reject)
    servidor.listen(0, '127.0.0.1', () => { const { port } = servidor.address(); servidor.close(() => resolve(port)) })
  })
}

function pedir(puerto, { method = 'GET', ruta = '/api/oficios', host = `127.0.0.1:${puerto}`, origin, cuerpo } = {}) {
  return new Promise((resolve, reject) => {
    const headers = { host, ...(origin ? { origin } : {}), ...(cuerpo !== undefined ? { 'content-type': 'application/json' } : {}) }
    const req = request({ host: '127.0.0.1', port: puerto, method, path: ruta, headers }, (res) => {
      let texto = ''
      res.setEncoding('utf8')
      res.on('data', (parte) => { texto += parte })
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, texto }))
    })
    req.once('error', reject)
    req.end(cuerpo)
  })
}

describe('Fixture de la demo ADMINISTRADOR', () => {
  it('prepara oficios activos/inactivos y comentarios moderables en memoria', () => {
    const api = crearDemoAdmin()
    expect(api.oficios.slice(0, 2).map(({ nombre, activo }) => [nombre, activo])).toEqual([['QA Plomería', true], ['QA Electricidad', false]])
    expect(api.oficios.at(-1)).toMatchObject({ id: idQA(203), nombre: 'QA Pintura', activo: true })
    expect(api.calificaciones.slice(-3).map((c) => c.moderada)).toEqual([false, false, true])
  })
})

describe('Servidor de demos QA', () => {
  const demos = []
  let admin, cliente
  beforeAll(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const [web, api, webCliente, apiCliente] = await Promise.all([puertoLibre(), puertoLibre(), puertoLibre(), puertoLibre()])
    admin = { web, api, origin: `http://127.0.0.1:${web}` }
    admin.demo = await iniciarDemo({ api: crearDemoAdmin(), rol: 'ADMINISTRADOR', puertoWeb: web, puertoApi: api, rutaInicial: '/admin', avisoId: 'qa-admin-aviso', restringirConexiones: false })
    demos.push(admin.demo)
    cliente = { web: webCliente, api: apiCliente }
    cliente.demo = await iniciarDemo({ api: crearDemoCliente('completo'), rol: 'CLIENTE', puertoWeb: webCliente, puertoApi: apiCliente, escenario: 'completo', rutaInicial: '/cliente' })
    demos.push(cliente.demo)
  }, 60000)
  afterAll(async () => {
    for (const demo of demos) await demo.cerrar()
    vi.restoreAllMocks()
  })

  it('inyecta la sesión ficticia y el aviso; la CSP solo en las demos que restringen conexiones', async () => {
    const html = (await pedir(admin.web, { ruta: '/admin' })).texto
    expect(html).toContain('id="qa-admin-aviso"')
    expect(html).toContain('DEMO LOCAL — DATOS FICTICIOS. Sesión ADMINISTRADOR de prueba.')
    expect(html).toContain("sessionStorage.setItem('servimap-jwt'")
    expect(html).not.toContain('Content-Security-Policy')
    const htmlCliente = (await pedir(cliente.web, { ruta: '/cliente' })).texto
    expect(htmlCliente).toContain('Escenario: completo. DEMO QA — DATOS FICTICIOS. Sesión CLIENTE de prueba.')
    expect(htmlCliente).toContain('http-equiv="Content-Security-Policy"')
    expect(htmlCliente).toMatch(new RegExp(`connect-src [^"]*http://127\\.0\\.0\\.1:${cliente.api}`))
  })
  it('rechaza un Host ajeno también en el servidor web', async () => {
    expect((await pedir(admin.web, { ruta: '/admin', host: 'evil.example' })).status).toBe(403)
  })
  it('responde la fixture con CORS limitado al origen de la demo', async () => {
    const respuesta = await pedir(admin.api, { origin: admin.origin })
    expect(respuesta.status).toBe(200)
    expect(respuesta.headers['access-control-allow-origin']).toBe(admin.origin)
    expect(respuesta.headers['cache-control']).toBe('no-store')
    expect(JSON.parse(respuesta.texto).map((oficio) => oficio.nombre)).toContain('QA Pintura')
  })
  it.each([
    ['Host ajeno', { host: 'evil.example' }, 403],
    ['Origin ajeno', { origin: 'http://evil.example' }, 403],
    ['preflight', { method: 'OPTIONS', origin: true }, 204],
    ['método no soportado', { method: 'DELETE', origin: true }, 405],
    ['escritura sin Origin', { method: 'POST', cuerpo: '{}' }, 403],
    ['JSON inválido', { method: 'POST', origin: true, cuerpo: '{' }, 400],
    ['payload mayor a 64 KiB', { method: 'POST', origin: true, cuerpo: JSON.stringify({ texto: 'x'.repeat(70000) }) }, 413],
  ])('%s → %s', async (_caso, opciones, esperado) => {
    const respuesta = await pedir(admin.api, { ...opciones, origin: opciones.origin === true ? admin.origin : opciones.origin })
    expect(respuesta.status).toBe(esperado)
  })
})
