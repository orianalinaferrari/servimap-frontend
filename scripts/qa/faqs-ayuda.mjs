// QA del build local: no usa cuentas ni permite tráfico externo o escrituras.
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { preview } from 'vite'
import { abrirChromeCdp } from './chrome-cdp.mjs'

const carpeta = mkdtempSync(path.join(os.tmpdir(), 'servimap-qa-ayuda-'))
const servidor = await preview({ preview: { host: '127.0.0.1', port: 0, strictPort: true } })
const base = `http://127.0.0.1:${servidor.httpServer.address().port}`
const pendientes = new Map()
const errores = []
const verificaciones = []
let ws, proceso, numero = 0

function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++numero
    const timer = setTimeout(() => { pendientes.delete(id); reject(new Error(`Timeout ${method}`)) }, 15000)
    pendientes.set(id, {
      resolve: (r) => { clearTimeout(timer); resolve(r) },
      reject: (e) => { clearTimeout(timer); reject(e) },
    })
    ws.send(JSON.stringify({ id, method, params }))
  })
}

async function evaluar(expression) {
  const respuesta = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  assert.ok(!respuesta.exceptionDetails, respuesta.exceptionDetails?.text)
  return respuesta.result.value
}

async function hasta(expression) {
  const limite = Date.now() + 10000
  while (Date.now() < limite) {
    if (await evaluar(expression)) return
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  throw new Error(`No se cumplió: ${expression}`)
}

function check(valor, mensaje) {
  assert.ok(valor, mensaje)
  verificaciones.push(mensaje)
}

async function tecla(key, codigo, code) {
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: codigo, nativeVirtualKeyCode: codigo, ...(key === 'Enter' ? { text: '\r' } : key === ' ' ? { text: ' ' } : {}) })
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: codigo })
}

async function captura(nombre) {
  const { data } = await cdp('Page.captureScreenshot', { format: 'png' })
  writeFileSync(path.join(carpeta, `${nombre}.png`), Buffer.from(data, 'base64'))
}

try {
  const chrome = await abrirChromeCdp(carpeta)
  proceso = chrome.proceso
  ws = new WebSocket(chrome.pagina.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
  ws.onmessage = ({ data }) => {
    const mensaje = JSON.parse(data)
    if (mensaje.id) {
      const pendiente = pendientes.get(mensaje.id)
      pendientes.delete(mensaje.id)
      if (mensaje.error) pendiente?.reject(new Error(mensaje.error.message))
      else pendiente?.resolve(mensaje.result)
    } else if (mensaje.method === 'Fetch.requestPaused') {
      const { requestId, request } = mensaje.params
      const permitido = new URL(request.url).origin === base && request.method === 'GET'
      cdp(permitido ? 'Fetch.continueRequest' : 'Fetch.failRequest', permitido
        ? { requestId }
        : { requestId, errorReason: 'BlockedByClient' }).catch(error => errores.push(error.message))
      if (!permitido) errores.push('La ayuda intentó contactar un recurso externo o realizar una escritura')
    } else if (mensaje.method === 'Runtime.exceptionThrown') errores.push(mensaje.params.exceptionDetails.text)
    else if (mensaje.method === 'Network.responseReceived' && mensaje.params.response.status >= 400) errores.push(`HTTP ${mensaje.params.response.status}`)
  }
  await cdp('Page.enable')
  await cdp('Page.bringToFront')
  await cdp('Runtime.enable')
  await cdp('Network.enable')
  await cdp('Fetch.enable', { patterns: [{ urlPattern: '*' }] })
  await cdp('Page.navigate', { url: `${base}/login` })
  await hasta(`!!document.querySelector('a[href="/ayuda"]')`)
  await evaluar(`document.querySelector('a[href="/ayuda"]').click()`)
  await hasta(`!!document.querySelector('.ayuda-pagina')`)
  check(await evaluar(`location.pathname === '/ayuda'`), 'Navegación desde login a la ayuda pública')

  await evaluar(`document.querySelector('summary').focus()`)
  check(await evaluar(`document.activeElement === document.querySelector('summary')`), 'La pregunta recibe foco')
  await tecla('Enter', 13, 'Enter')
  check(await evaluar(`document.querySelector('details').open`), 'Enter abre una pregunta con teclado')
  await tecla(' ', 32, 'Space')
  check(await evaluar(`!document.querySelector('details').open`), 'Espacio cierra una pregunta con teclado')
  check(await evaluar(`getComputedStyle(document.activeElement).outlineStyle !== 'none'`), 'Foco de teclado visible en la pregunta')
  const ax = await cdp('Accessibility.getFullAXTree')
  check(ax.nodes.filter(node => node.role?.value === 'DisclosureTriangle' && node.name?.value).length === 10, 'Diez preguntas con semántica nativa y nombre accesible')

  await evaluar(`document.querySelectorAll('details').forEach(detalle => detalle.querySelector('summary').click())`)
  for (const width of [320, 390, 768, 1024, 1365]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 })
    await evaluar(`document.fonts.ready`)
    check(await evaluar(`document.documentElement.scrollWidth <= innerWidth`), `FAQ desplegadas sin desbordamiento a ${width}px`)
    check(await evaluar(`[...document.querySelectorAll('summary')].every(e => e.getBoundingClientRect().height >= 44)`), `Preguntas con área de interacción suficiente a ${width}px`)
    await evaluar('scrollTo(0, 0)')
    if (width === 390 || width === 1365) await captura(`ayuda-cabecera-${width}`)
    await evaluar(`document.querySelector('.ayuda-breve button').scrollIntoView({ block: 'center' }); document.querySelector('.ayuda-breve button').focus()`)
    check(await evaluar(`!!document.querySelector('[role="tooltip"]')`), `Tooltip disponible con foco a ${width}px`)
    check(await evaluar(`(() => { const r = document.querySelector('[role="tooltip"]').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth })()`), `Tooltip dentro de la pantalla a ${width}px`)
    await captura(`ayuda-${width}`)
    await tecla('Escape', 27, 'Escape')
    check(await evaluar(`!document.querySelector('[role="tooltip"]') && document.activeElement.matches('.ayuda-breve button')`), `Escape oculta la ayuda sin perder el foco a ${width}px`)
    await evaluar(`document.activeElement.blur()`)
  }

  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: true })
  await evaluar(`document.querySelector('.ayuda-breve button').scrollIntoView({ block: 'center' })`)
  const punto = await evaluar(`(() => { const r = document.querySelector('.ayuda-breve button').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)
  await cdp('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [punto] })
  await cdp('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await hasta(`!!document.querySelector('[role="tooltip"]')`)
  check(true, 'Tooltip disponible al tocar en móvil')
  await cdp('Page.navigate', { url: `${base}/ayuda` })
  await hasta(`!!document.querySelector('.ayuda-pagina')`)
  check(await evaluar(`document.querySelectorAll('details[open]').length === 0`), 'Acceso directo al build sin sesión y preguntas inicialmente cerradas')

  await evaluar(`document.querySelector('.servimap-logo').click()`)
  await hasta(`!!document.querySelector('.landing-entrada')`)
  for (const width of [320, 390, 768, 1024, 1365]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 })
    check(await evaluar(`(() => { const a = document.querySelector('.landing-cabecera a[href="/ayuda"]'), r = a.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === a })()`), `Enlace de ayuda de inicio visible y alcanzable a ${width}px`)
    if (width === 320 || width === 1024) await captura(`inicio-${width}`)
  }
  await evaluar(`document.querySelector('a[href="/ayuda"]').click()`)
  await hasta(`!!document.querySelector('.ayuda-pagina')`)
  check(true, 'Navegación desde inicio a la ayuda')
  check(errores.length === 0, `Sin errores de JavaScript, HTTP ni tráfico externo: ${errores.join(', ')}`)
  console.log(JSON.stringify({ aprobado: true, verificaciones: verificaciones.length, node: process.version, carpeta }))
} catch (error) {
  process.exitCode = 1
  console.error(error)
  if (ws?.readyState === WebSocket.OPEN) await captura('fallo').catch(() => {})
} finally {
  writeFileSync(path.join(carpeta, 'resultado.json'), JSON.stringify({ verificaciones, errores }, null, 2))
  if (ws?.readyState === WebSocket.OPEN) { await cdp('Browser.close').catch(() => {}); ws.close() }
  else proceso?.kill()
  await new Promise(resolve => servidor.httpServer.close(resolve))
}
