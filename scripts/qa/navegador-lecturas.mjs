// Navegación pública con API REAL. Bloquea escrituras antes de enviarlas.
// Con SERVIMAP_QA_LECTURAS_API (solo loopback) recorre una fixture local de QA; nunca producción.
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { abrirChromeCdp } from './chrome-cdp.mjs'
import { configuracionLecturasQa } from './protocolo-cdp.mjs'

const { local, api, web: base } = configuracionLecturasQa()
const carpeta = mkdtempSync(path.join(os.tmpdir(), 'servimap-qa-lecturas-'))
let proceso
const reporte = { tipo: local ? 'Navegador público, fixture local de QA, solo lecturas' : 'Navegador público, API real, solo lecturas', verificaciones: [], api: [], bloqueadas: [], errores: [], carpeta }
const pendientes = new Map()
let ws, numero = 0, falloRed
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++numero
    const timer = setTimeout(() => { pendientes.delete(id); reject(new Error(`Timeout ${method}`)) }, 20000)
    pendientes.set(id, { resolve: (r) => { clearTimeout(timer); resolve(r) }, reject: (e) => { clearTimeout(timer); reject(e) } })
    ws.send(JSON.stringify({ id, method, params }))
  })
}
async function evaluar(expression) {
  const r = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text)
  return r.result.value
}
async function hasta(expression, mensaje) {
  const limite = Date.now() + 30000
  while (Date.now() < limite) {
    if (falloRed) throw falloRed
    if (await evaluar(expression)) return
    await esperar(100)
  }
  throw new Error(`Timeout: ${mensaje}`)
}
function check(valor, mensaje) { assert.ok(valor, mensaje); reporte.verificaciones.push(mensaje) }
async function captura(nombre) {
  const r = await cdp('Page.captureScreenshot', { format: 'png' })
  writeFileSync(path.join(carpeta, `${nombre}.png`), Buffer.from(r.data, 'base64'))
}
try {
  const chrome = await abrirChromeCdp(carpeta)
  proceso = chrome.proceso
  ws = new WebSocket(chrome.pagina.webSocketDebuggerUrl)
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })
  ws.onmessage = ({ data }) => {
    const m = JSON.parse(data)
    if (m.id) {
      const p = pendientes.get(m.id); pendientes.delete(m.id)
      if (m.error) p?.reject(new Error(m.error.message)); else p?.resolve(m.result)
    } else if (m.method === 'Fetch.requestPaused') {
      const { requestId, request } = m.params
      const credencial = Object.keys(request.headers).some((h) => ['authorization', 'cookie'].includes(h.toLowerCase()))
      const permitido = ['GET', 'OPTIONS'].includes(request.method) && !credencial
      if (!permitido) reporte.bloqueadas.push({ method: request.method, ruta: new URL(request.url).pathname })
      cdp(permitido ? 'Fetch.continueRequest' : 'Fetch.failRequest', permitido ? { requestId } : { requestId, errorReason: 'BlockedByClient' }).catch((e) => { falloRed = e })
    } else if (m.method === 'Runtime.exceptionThrown') reporte.errores.push(m.params.exceptionDetails.text)
    else if (m.method === 'Network.loadingFailed' && !m.params.canceled) reporte.errores.push(m.params.errorText)
    else if (m.method === 'Network.responseReceived') {
      const r = m.params.response, url = new URL(r.url)
      if (url.origin === api) reporte.api.push({ ruta: url.pathname, status: r.status })
      if (r.status >= 400) reporte.errores.push(`${r.status} ${url.origin}${url.pathname}`)
    }
  }
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable')
  await cdp('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] })
  for (const ruta of ['/', '/prestadores', '/login', '/registro', '/cliente', '/prestador', '/admin']) {
    await cdp('Page.navigate', { url: base + ruta })
    await hasta(`!!document.querySelector('#root header')`, 'React montado')
    if (['/cliente', '/prestador', '/admin'].includes(ruta)) {
      await hasta(`location.pathname==='/login'`, 'redirección sin sesión')
      check(true, `${ruta}: acceso sin sesión redirige a login`)
    }
    if (ruta === '/prestadores') {
      await hasta(`document.querySelector('.mapa-interactivo')?.getAttribute('aria-busy')==='false'`, 'Liberty cargado')
      await hasta(`document.querySelector('.mapa-marcador') || document.body.innerText.includes('Todavía no hay prestadores con coordenadas registradas.')`, 'mapa remoto resuelto')
      check(await evaluar(`!!document.querySelector('.maplibregl-ctrl-attrib')?.textContent.includes('OpenStreetMap')`), 'Liberty real con créditos visibles')
      reporte.marcadores = await evaluar(`document.querySelectorAll('.mapa-marcador').length`)
      check(reporte.api.some((r) => r.ruta === '/api/prestadores/mapa' && r.status === 200), 'GET mapa real desde navegador, CORS permitido')
      check(reporte.api.some((r) => r.ruta === '/api/prestadores' && r.status === 200), 'GET directorio real desde navegador')
    }
    for (const width of [320, 390, 768, 1365]) {
      await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 })
      await esperar(200)
      check(await evaluar('document.documentElement.scrollWidth<=innerWidth'), `${ruta}: sin overflow ${width}px`)
      check(await evaluar(`[...document.querySelectorAll('input:not([type=hidden]),select,textarea')].every(e=>e.labels?.length||e.getAttribute('aria-label'))`), `${ruta}: campos etiquetados ${width}px`)
      if (width === 320 || width === 1365) await captura(`${ruta.slice(1) || 'inicio'}-${width}`)
      if (ruta === '/prestadores' && (width === 320 || width === 1365)) {
        await evaluar(`document.querySelector('.mapa-interactivo').scrollIntoView({block:'center'})`)
        await esperar(200)
        await captura(`mapa-${width}`)
        await evaluar('scrollTo(0,0)')
      }
    }
  }
  check(await evaluar('!sessionStorage.length && !localStorage.length'), 'sin credenciales persistidas')
  check(reporte.bloqueadas.length === 0, 'ninguna escritura ni credencial enviada')
  check(reporte.errores.length === 0, 'sin errores JavaScript, HTTP ni recursos fallidos')
  reporte.aprobado = true
} catch (error) {
  reporte.aprobado = false; reporte.error = error.message; process.exitCode = 1
  if (ws?.readyState === WebSocket.OPEN) await captura('fallo').catch(() => {})
} finally {
  writeFileSync(path.join(carpeta, 'resultado.json'), JSON.stringify(reporte, null, 2))
  console.log(JSON.stringify({ ...reporte, verificaciones: reporte.verificaciones.length }))
  if (ws?.readyState === WebSocket.OPEN) { await cdp('Browser.close').catch(() => {}); ws.close() } else proceso?.kill()
}
