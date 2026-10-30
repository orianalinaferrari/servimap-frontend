import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { crearServidorApiQa } from '../../scripts/qa/demo-local.mjs'
import { crearApiSimulada } from '../../scripts/qa/api-simulada.mjs'
import { verificarLecturas } from '../../scripts/qa/lecturas-reales.mjs'
import { configuracionLecturasQa } from '../../scripts/qa/protocolo-cdp.mjs'

const WEB = 'http://127.0.0.1:5999'
const servidores = []
// El setup bloquea fetch; aquí solo se usa contra la fixture loopback creada en cada prueba.
beforeEach(() => vi.unstubAllGlobals())
afterEach(async () => { for (const s of servidores.splice(0)) await new Promise((r) => s.close(r)) })

// Fixture HTTP real sobre la API simulada; `alterar` modifica una respuesta para probar cada validación.
async function fixture(alterar = (_ruta, r) => r) {
  const base = crearApiSimulada(), origenes = { web: WEB }
  const api = { responder: (req) => alterar(new URL(req.url).pathname + new URL(req.url).search, base.responder(req)) }
  const servidor = crearServidorApiQa(api, origenes)
  servidores.push(servidor)
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r))
  origenes.api = `http://127.0.0.1:${servidor.address().port}`
  return origenes.api
}

describe('Lecturas contra fixture local', () => {
  it('valida salud, catálogo, directorio, mapa, ficha, CORS y rutas protegidas', async () => {
    const resultados = await verificarLecturas({ origin: await fixture(), web: WEB })
    expect(resultados.map((r) => [r.ruta, r.status])).toEqual([
      ['/health', 200], ['/api/oficios', 200], ['/api/prestadores?limit=50', 200], ['/api/prestadores/mapa', 200],
      ['/api/auth/me', 401], ['/api/solicitudes', 401], ['/api/calificaciones', 401], ['/api/oficios/todos', 401],
      ['/api/prestadores/:id', 200],
    ])
    expect(resultados.find((r) => r.ruta === '/api/prestadores?limit=50').elementos).toBeGreaterThan(0)
  })
  it.each([
    ['un dato privado expuesto en el directorio', (ruta, r) => ruta.startsWith('/api/prestadores?') ? { ...r, body: r.body.map((p) => ({ ...p, dni: '12345678' })) } : r, /dni/],
    ['una ruta protegida accesible sin token', (ruta, r) => ruta === '/api/solicitudes' ? { status: 200, body: [] } : r, /\/api\/solicitudes/],
    ['coordenadas públicas sin redondear', (ruta, r) => ruta === '/api/prestadores/mapa' ? { ...r, body: [{ id: 'm1', latitud: -31.418123, longitud: -64.18 }] } : r, /-31\.418123|-31\.42/],
    ['un catálogo con formato incorrecto', (ruta, r) => ruta === '/api/oficios' ? { ...r, body: [{ id: 'o1', nombre: 'Plomería', activo: 'si' }] } : r, /activo|boolean|'si'/],
    ['una salud degradada', (ruta, r) => ruta === '/health' ? { ...r, body: { status: 'degradado' } } : r, /degradado/],
  ])('rechaza %s', async (_caso, alterar, mensaje) => {
    await expect(verificarLecturas({ origin: await fixture(alterar), web: WEB })).rejects.toThrow(mensaje)
  })
  it('rechaza un origen de frontend no autorizado por la fixture', async () => {
    await expect(verificarLecturas({ origin: await fixture(), web: 'http://127.0.0.1:6000' })).rejects.toThrow()
  })
})

describe('Selección explícita del modo de lecturas', () => {
  it('sin variable usa el backend publicado y el frontend local habitual', () => {
    expect(configuracionLecturasQa({})).toEqual({ local: false, api: 'https://servimap-backend.vercel.app', web: 'http://localhost:5173' })
  })
  it('con variable acepta solo orígenes http de loopback', () => {
    expect(configuracionLecturasQa({ SERVIMAP_QA_LECTURAS_API: 'http://127.0.0.1:4300/x', SERVIMAP_QA_BASE_URL: 'http://localhost:5174/' }))
      .toEqual({ local: true, api: 'http://127.0.0.1:4300', web: 'http://localhost:5174' })
    expect(() => configuracionLecturasQa({ SERVIMAP_QA_LECTURAS_API: 'https://servimap-backend.vercel.app' })).toThrow('loopback')
    expect(() => configuracionLecturasQa({ SERVIMAP_QA_LECTURAS_API: 'http://127.0.0.1:4300', SERVIMAP_QA_BASE_URL: 'http://evil.example' })).toThrow('loopback')
  })
})
