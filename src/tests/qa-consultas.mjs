// QA de componentes aún no habilitados: servidor loopback y adaptador de tests.
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createServer } from 'vite'
import { abrirChromeCdp } from '../../scripts/qa/chrome-cdp.mjs'

const carpeta = mkdtempSync(path.join(os.tmpdir(), 'servimap-qa-consultas-'))
const server = await createServer({ envDir: false, server: { host: '127.0.0.1', port: 0, strictPort: true }, plugins: [{
  name: 'entrada-exclusiva-qa-consultas',
  configureServer(vite) {
    vite.middlewares.use('/qa-consultas', async (_req, res, next) => {
      try {
        const html = await vite.transformIndexHtml('/qa-consultas', '<!doctype html><html lang="es-AR"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>QA consultas — datos ficticios</title></head><body><div id="root"></div><script type="module" src="/src/tests/helpers/ConsultasDemo.jsx"></script></body></html>')
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(html)
      } catch (error) { next(error) }
    })
  },
}] })
let ws, proceso, numero = 0
const pendientes = new Map(), errores = [], checks = []
function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++numero, timer = setTimeout(() => { pendientes.delete(id); reject(new Error(`Timeout ${method}`)) }, 20000)
    pendientes.set(id, { resolve: r => { clearTimeout(timer); resolve(r) }, reject: e => { clearTimeout(timer); reject(e) } })
    ws.send(JSON.stringify({ id, method, params }))
  })
}
async function ev(expression) {
  const r = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  assert.ok(!r.exceptionDetails, r.exceptionDetails?.text)
  return r.result.value
}
async function until(expression) {
  for (let n = 0; n < 200; n++) { if (await ev(expression)) return; await new Promise(resolve => setTimeout(resolve, 50)) }
  throw new Error(`No se cumplió ${expression}`)
}
function check(valor, nombre) { assert.ok(valor, nombre); checks.push(nombre) }
async function click(nombre) { await ev(`[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(nombre)}).click()`) }
async function fill(etiqueta, valor) {
  await ev(`(() => { const e = [...document.querySelectorAll('input, select, textarea')].find(e => [...e.labels].some(l => l.textContent === ${JSON.stringify(etiqueta)})); Object.getOwnPropertyDescriptor(Object.getPrototypeOf(e), 'value').set.call(e, ${JSON.stringify(valor)}); e.dispatchEvent(new Event(e.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); })()`)
}
async function tecla(key, code, windowsVirtualKeyCode) {
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode, ...(key === 'Enter' ? { text: '\r' } : {}) })
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode })
}
async function responsive(nombre) {
  for (const width of [320, 390, 768, 1365]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 })
    await ev('document.fonts.ready')
    check(await ev('document.documentElement.scrollWidth <= innerWidth'), `${nombre} sin overflow a ${width}px`)
    check(await ev(`[...document.querySelectorAll('.centro-consultas button')].every(e => { const r = e.getBoundingClientRect(); return r.width >= 44 && r.height >= 44 })`), `${nombre} con botones táctiles utilizables a ${width}px`)
    const { data } = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
    writeFileSync(path.join(carpeta, `${nombre}-${width}.png`), Buffer.from(data, 'base64'))
  }
}
try {
  await server.listen()
  const base = `http://127.0.0.1:${server.httpServer.address().port}`
  const chrome = await abrirChromeCdp(carpeta); proceso = chrome.proceso
  ws = new WebSocket(chrome.pagina.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
  ws.onmessage = ({ data }) => {
    const m = JSON.parse(data)
    if (m.id) { const p = pendientes.get(m.id); pendientes.delete(m.id); if (m.error) p?.reject(new Error(m.error.message)); else p?.resolve(m.result) }
    else if (m.method === 'Runtime.exceptionThrown') errores.push(m.params.exceptionDetails.text)
    else if (m.method === 'Fetch.requestPaused') {
      const { requestId, request } = m.params
      const permitido = new URL(request.url).origin === base && request.method === 'GET'
      if (!permitido) errores.push('Tráfico externo o escritura bloqueada')
      cdp(permitido ? 'Fetch.continueRequest' : 'Fetch.failRequest', permitido ? { requestId } : { requestId, errorReason: 'BlockedByClient' }).catch(e => errores.push(e.message))
    }
  }
  await cdp('Runtime.enable'); await cdp('Page.enable'); await cdp('Page.bringToFront')
  await cdp('Fetch.enable', { patterns: [{ urlPattern: '*' }] })
  await cdp('Page.navigate', { url: `${base}/qa-consultas` })
  await until(`!!document.querySelector('[aria-label="Historial de consultas"]')`)
  check(await ev(`document.body.textContent.includes('DEMO QA')`), 'Datos de prueba identificados')
  check(await ev(`!document.body.textContent.includes('Consulta ficticia del prestador')`), 'Cliente no ve consulta ajena')
  await responsive('formulario-cliente')
  await click('Enviar consulta')
  check(await ev(`document.querySelectorAll('[role="alert"]').length === 3`), 'Campos requeridos con errores accesibles')
  await fill('Categoría', 'OTRAS'); await fill('Asunto', 'Consulta creada solo en QA'); await fill('Mensaje', 'Texto ficticio sin datos personales.')
  await ev(`document.querySelector('button[type="submit"]').focus()`)
  await tecla('Enter', 'Enter', 13)
  await until(`document.body.textContent.includes('La consulta fue registrada por el servidor.')`)
  check(await ev(`document.querySelector('input').value === ''`), 'Envío de prueba confirmado antes de limpiar')
  await fill('Rol de prueba', 'PRESTADOR')
  await until(`document.body.textContent.includes('Consulta ficticia del prestador')`)
  check(await ev(`!document.body.textContent.includes('Consulta ficticia de acceso')`), 'Prestador solo ve sus mensajes')
  await responsive('historial-prestador')
  await fill('Rol de prueba', 'ADMINISTRADOR')
  await until(`document.querySelectorAll('[aria-label^="Ver consulta:"]').length === 2`)
  check(await ev(`!document.querySelector('[aria-label="Nueva consulta"]')`), 'Administrador sin formulario de creación de usuario')
  await click('Ver detalle')
  await until(`!!document.querySelector('[aria-label="Responder consulta"]')`)
  await responsive('respuesta-administrador')
  await fill('Respuesta del administrador', 'Respuesta ficticia preparada en QA.')
  await click('Enviar respuesta')
  await until(`document.body.textContent.includes('La respuesta fue guardada por el servidor.')`)
  check(await ev(`!document.querySelector('[aria-label="Responder consulta"]')`), 'Estado respondido sin otra respuesta')
  await click('Preparar cierre'); await click('Volver sin cerrar')
  check(await ev(`!document.body.textContent.includes('El cierre fue confirmado por el servidor.')`), 'Cancelar cierre no lo confirma')
  await click('Preparar cierre'); await click('Confirmar cierre')
  await until(`document.body.textContent.includes('El cierre fue confirmado por el servidor.')`)
  check(await ev(`![...document.querySelectorAll('button')].some(e=>e.textContent==='Preparar cierre')`), 'Consulta cerrada sin acciones incompatibles')
  await responsive('detalle-cerrado')
  await click('Volver al historial')
  await fill('Filtrar consultas por estado', 'CERRADA')
  await until(`document.querySelectorAll('[aria-label^="Ver consulta:"]').length === 1`)
  check(true, 'Filtro de estado administrativo')
  const ax = await cdp('Accessibility.getFullAXTree')
  check(ax.nodes.some(n => n.role?.value === 'combobox' && n.name?.value === 'Filtrar consultas por estado'), 'Filtro con nombre accesible')
  check(errores.length === 0, `Sin errores ni tráfico externo: ${errores.join(', ')}`)
  console.log(JSON.stringify({ aprobado: true, verificaciones: checks.length, tipo: 'Componentes con adaptador ficticio en memoria; no valida persistencia backend', carpeta }))
} catch (e) { process.exitCode = 1; console.error(e) }
finally {
  writeFileSync(path.join(carpeta, 'resultado.json'), JSON.stringify({ checks, errores }, null, 2))
  if (ws?.readyState === WebSocket.OPEN) { await cdp('Browser.close').catch(() => {}); ws.close() } else proceso?.kill()
  await server.close()
}
