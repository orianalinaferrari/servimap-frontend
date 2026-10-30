// Base compartida de los recorridos QA contra las demos locales; nunca usa el backend publicado.
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { abrirChromeCdp } from './chrome-cdp.mjs'

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function ejecutarRecorridoDemo({ nombre, apiOrigin, url, recorrido }) {
  const folder = mkdtempSync(path.join(os.tmpdir(), `servimap-${nombre}-`))
  const profile = path.join(folder, 'perfil')
  const pending = new Map(), results = [], errors = [], requests = []
  let ws, seq = 0, blocked = 0, chrome

  function cdp(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++seq, timer = setTimeout(() => reject(new Error(method + ' timeout')), 30000)
      pending.set(id, { resolve: (dato) => { clearTimeout(timer); resolve(dato) }, reject: (error) => { clearTimeout(timer); reject(error) } })
      ws.send(JSON.stringify({ id, method, params }))
    })
  }
  async function ev(expression) {
    const r = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }).catch((e) => { throw new Error(expression.slice(0, 90) + ': ' + e.message) })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
    return r.result.value
  }
  async function shot(name, width, height) {
    const s = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height, scale: 1 } })
    writeFileSync(path.join(folder, name + '.png'), Buffer.from(s.data, 'base64'))
  }
  async function until(expression, name) {
    for (let i = 0; i < 200; i++) {
      try { if (await ev(expression)) return } catch (error) {
        // Solo se tolera el contexto destruido por una navegación en curso; otros errores fallan de inmediato.
        if (!/context/i.test(error.message)) throw error
      }
      await esperar(100)
    }
    throw new Error(name)
  }
  function check(value, name) { assert.ok(value, name); results.push(name) }
  async function go(route, condition) {
    await ev('history.pushState(null,"",' + JSON.stringify(route) + ');dispatchEvent(new PopStateEvent("popstate"))')
    await until(condition, route)
    await ev('document.fonts.ready.then(()=>true)')
  }
  async function click(name, scope = 'document') {
    await ev('(()=>{const e=[...' + scope + '.querySelectorAll("button,a")].find(e=>(e.getAttribute("aria-label")||e.textContent).trim()===' + JSON.stringify(name) + '&&!e.disabled);if(!e)throw Error("Control ausente: "+' + JSON.stringify(name) + ');e.click()})()')
    await esperar(100)
  }
  async function fill(id, value) {
    await ev('(()=>{const e=document.getElementById(' + JSON.stringify(id) + ');const proto=e.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:e.tagName==="SELECT"?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,"value").set.call(e,' + JSON.stringify(value) + ');e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}))})()')
  }
  async function capture(name) {
    const size = await ev('({width:innerWidth,height:document.documentElement.scrollHeight})')
    await shot(name, size.width, size.height)
  }
  async function screens(name) {
    for (const width of [1365, 768, 390, 320]) {
      await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width <= 390 })
      await ev('scrollTo(0,0)'); await esperar(200)
      check(await ev('document.documentElement.scrollWidth<=innerWidth'), name + ' sin overflow ' + width)
      await capture(name + '-' + width)
    }
    await cdp('Emulation.setDeviceMetricsOverride', { width: 1365, height: 900, deviceScaleFactor: 1, mobile: false })
  }
  function recibir({ data }) {
    const m = JSON.parse(data), p = pending.get(m.id)
    if (p) {
      pending.delete(m.id)
      if (m.error) p.reject(new Error(m.error.message)); else p.resolve(m.result)
    } else if (m.method === 'Fetch.requestPaused') {
      blocked++
      cdp('Fetch.failRequest', { requestId: m.params.requestId, errorReason: 'BlockedByClient' }).catch(() => {})
    } else if (m.method === 'Network.requestWillBeSent') {
      const u = new URL(m.params.request.url)
      if (u.origin === apiOrigin) requests.push({ method: m.params.request.method, path: u.pathname })
    } else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text)
  }

  try {
    chrome = await abrirChromeCdp(folder)
    ws = new WebSocket(chrome.pagina.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
    ws.onmessage = recibir
    await cdp('Page.enable'); await cdp('Runtime.enable')
    await cdp('Fetch.enable', { patterns: [{ urlPattern: 'https://servimap-backend.vercel.app/*', requestStage: 'Request' }] })
    await cdp('Network.enable')
    await cdp('Emulation.setDeviceMetricsOverride', { width: 1365, height: 900, deviceScaleFactor: 1, mobile: false })
    await cdp('Page.navigate', { url })
    const escenario = await recorrido({ cdp, ev, until, check, go, click, fill, capture, screens, wait: esperar })
    check(blocked === 0, 'Ninguna conexion al backend publicado')
    check(requests.every((r) => r.path.startsWith('/api/')), 'Solo contratos API existentes')
    assert.equal(errors.length, 0)
    writeFileSync(path.join(folder, 'resultado.json'), JSON.stringify({ aprobado: true, escenario, results, requests, blocked, errors }, null, 2))
    console.log(JSON.stringify({ aprobado: true, escenario, checks: results.length, folder, blocked, errors }))
  } catch (error) {
    writeFileSync(path.join(folder, 'resultado.json'), JSON.stringify({ aprobado: false, error: error.message, results, requests, errors, folder }, null, 2))
    console.error(JSON.stringify({ aprobado: false, error: error.message, folder }))
    process.exitCode = 1
    if (ws?.readyState === WebSocket.OPEN) {
      try { await shot('fallo', 1365, 900) } catch { /* El navegador puede haber cerrado la página. */ }
    }
  } finally {
    if (ws?.readyState === WebSocket.OPEN) { await cdp('Browser.close').catch(() => {}); ws.close() }
    chrome?.proceso.kill()
    const target = path.resolve(profile)
    assert.ok(target.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(target) === 'perfil')
    try { rmSync(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }) } catch { /* Limpieza de recursos de QA: el navegador puede haber cerrado el perfil. */ }
  }
}
