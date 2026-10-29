// Chrome/Edge headless + CDP, sin dependencias externas. Toda API se intercepta.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { crearApiSimulada, CUENTAS_QA, idQA, politicaDeRed, API_SIMULADA_ORIGIN } from './api-simulada.mjs'

const base = process.env.SERVIMAP_QA_BASE_URL || 'http://localhost:5173'
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Solo se permite un frontend local')
const chrome = [process.env.SERVIMAP_QA_BROWSER, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/chromium', '/usr/bin/google-chrome'].find((p) => p && existsSync(p))
assert.ok(chrome, 'No hay Chrome/Edge instalado; no se descarga ningún navegador')
const carpeta = mkdtempSync(path.join(os.tmpdir(), 'servimap-qa-browser-'))
const proceso = spawn(chrome, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${path.join(carpeta, 'perfil')}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-background-networking', '--disable-sync', 'about:blank'], { windowsHide: true, stdio: 'ignore' })
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
const api = crearApiSimulada(), pendientes = new Map()
const reporte = { tipo: 'navegador con API simulada; ninguna escritura real', verificaciones: [], erroresConsola: [], recursosFallidos: [], escriturasBloqueadas: [], carpeta }
let ws, numero = 0, fase = 'inicio', falloIntercepcion
const check = (condicion, nombre) => { assert.ok(condicion, nombre); reporte.verificaciones.push(nombre) }
function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++numero, timer = setTimeout(() => { pendientes.delete(id); reject(new Error(`Timeout CDP: ${method}`)) }, 20000)
    pendientes.set(id, { resolve: (dato) => { clearTimeout(timer); resolve(dato) }, reject: (error) => { clearTimeout(timer); reject(error) } })
    ws.send(JSON.stringify({ id, method, params }))
  })
}
async function evaluar(expression) {
  const r = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result.value
}
async function hasta(expression, mensaje, tiempo = 16000) {
  const limite = Date.now() + tiempo
  while (Date.now() < limite) {
    if (falloIntercepcion) throw falloIntercepcion
    if (await evaluar(expression)) return
    await esperar(100)
  }
  throw new Error(`No se cumplió: ${mensaje}`)
}
const texto = (valor) => JSON.stringify(valor)
async function verTexto(valor) { await hasta(`document.body.innerText.includes(${texto(valor)})`, valor) }
async function ir(ruta) {
  await cdp('Page.navigate', { url: new URL(ruta, base).href })
  await hasta(`!!document.querySelector('#root header')`, 'React montado')
}
async function click(nombre, idSolicitud) {
  const selector = idSolicitud ? `[...document.querySelectorAll('article')].find(e=>e.textContent.includes(${texto(idSolicitud)}))` : 'document'
  const expr = `(()=>{const raiz=${selector};const e=[...(raiz?.querySelectorAll('button,a')||[])].find(e=>(e.getAttribute('aria-label')||e.textContent).trim()===${texto(nombre)}&&!e.disabled);if(e){e.click();return true}return false})()`
  await hasta(expr, `click ${nombre}`)
}
async function llenar(id, valor) {
  await hasta(`!!document.getElementById(${texto(id)})`, `campo ${id}`)
  await evaluar(`(()=>{const e=document.getElementById(${texto(id)});const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${texto(valor)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))})()`)
}
async function captura(nombre) {
  const r = await cdp('Page.captureScreenshot', { format: 'png' })
  writeFileSync(path.join(carpeta, `${nombre}.png`), Buffer.from(r.data, 'base64'))
}
async function responsive(nombre) {
  for (const width of [1365, 390]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: width === 390 ? 844 : 1000, deviceScaleFactor: 1, mobile: width === 390 })
    await esperar(180)
    check(await evaluar('document.documentElement.scrollWidth <= innerWidth'), `${nombre}: sin overflow ${width}px`)
    check(await evaluar(`[...document.querySelectorAll('input:not([type=hidden]),select,textarea')].every(e=>e.labels?.length||e.getAttribute('aria-label'))`), `${nombre}: campos etiquetados ${width}px`)
    if (width === 1365) await captura(`${nombre}-escritorio`)
  }
  await captura(`${nombre}-movil`)
}
async function login(cuenta) {
  await ir('/login'); await llenar('email', cuenta.email); await llenar('contrasena', cuenta.password)
  await click('Iniciar sesión'); await verTexto('Cerrar sesión')
}
async function logout() {
  await click('Cerrar sesión'); await hasta(`!sessionStorage.getItem('servimap-jwt')`, 'logout sin token')
  await verTexto('Crear cuenta')
}
async function crearSolicitud(descripcion) {
  await ir('/'); await click('QA PRESTADOR'); await click('Solicitar servicio')
  await llenar('solicitud-servicio', 'Plomería'); await llenar('solicitud-descripcion', descripcion)
  await llenar('solicitud-direccion', 'Dirección sintética de test'); await llenar('solicitud-contacto', 'Email')
  await click('Enviar solicitud'); await verTexto('Tu solicitud fue enviada correctamente.')
  return api.solicitudes.at(-1).id
}
try {
  const activo = path.join(carpeta, 'perfil', 'DevToolsActivePort')
  for (let n = 0; n < 100 && !existsSync(activo); n++) await esperar(100)
  assert.ok(existsSync(activo), 'Chrome no expuso CDP')
  const port = readFileSync(activo, 'utf8').split(/\r?\n/)[0]
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  const tab = tabs.find((t) => t.type === 'page' && t.url === 'about:blank')
  ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })
  ws.onmessage = ({ data }) => {
    const m = JSON.parse(data)
    if (m.id) {
      const p = pendientes.get(m.id); pendientes.delete(m.id)
      if (m.error) p?.reject(new Error(m.error.message)); else p?.resolve(m.result)
    } else if (m.method === 'Fetch.requestPaused') {
      const { request, requestId } = m.params
      ;(async () => {
        const url = new URL(request.url)
        const politica = politicaDeRed(request)
        if (politica === 'simular') {
          let body
          try { body = request.postData ? JSON.parse(request.postData) : undefined } catch { body = undefined }
          const r = api.responder({ method: request.method, url: request.url, headers: request.headers, body })
          await cdp('Fetch.fulfillRequest', { requestId, responseCode: r.status, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: new URL(base).origin }, { name: 'Access-Control-Allow-Headers', value: 'Authorization, Content-Type' }, { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' }], body: r.body == null ? '' : Buffer.from(JSON.stringify(r.body)).toString('base64') })
        } else if (politica === 'bloquear') {
          reporte.escriturasBloqueadas.push({ method: request.method, host: url.hostname })
          await cdp('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' })
        } else await cdp('Fetch.continueRequest', { requestId })
      })().catch((error) => { falloIntercepcion = error; cdp('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' }).catch(() => {}) })
    } else if (m.method === 'Runtime.exceptionThrown') reporte.erroresConsola.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text)
    else if (m.method === 'Network.loadingFailed' && !m.params.canceled) reporte.recursosFallidos.push(m.params.errorText)
    else if (m.method === 'Network.responseReceived' && m.params.response.status >= 400 && new URL(m.params.response.url).origin !== API_SIMULADA_ORIGIN) {
      const recurso = new URL(m.params.response.url)
      reporte.recursosFallidos.push(`${m.params.response.status} ${recurso.origin}${recurso.pathname}`)
    }
  }
  await cdp('Runtime.enable'); await cdp('Network.enable'); await cdp('Page.enable')
  await cdp('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] })
  fase = 'público y registro'
  await ir('/'); await verTexto('QA PRESTADOR'); await verTexto('Todavía no hay prestadores con coordenadas registradas.')
  await hasta(`document.querySelector('.mapa-interactivo')?.getAttribute('aria-busy')==='false'`, 'mapa cargado', 25000)
  check(await evaluar(`document.querySelector('.maplibregl-ctrl-attrib')?.textContent.includes('OpenStreetMap')`), 'mapa real Liberty: créditos')
  await llenar('busqueda', 'sin-coincidencias-qa'); await verTexto('No se encontraron prestadores con los criterios seleccionados.')
  check(true, 'búsqueda y estado vacío con API simulada')
  await llenar('busqueda', ''); await verTexto('QA PRESTADOR')
  await responsive('inicio')
  const nav = await evaluar(`Math.min(...[...document.querySelectorAll('.app-header nav a')].map(e=>e.getBoundingClientRect().height))`)
  reporte.alturaNavegacion = nav
  await click('Soy cliente'); await llenar('nombre', 'QA Registro'); await llenar('email', 'registro@example.test'); await llenar('dni', '98.765.432'); await llenar('contrasena', 'fixture-local-only'); await llenar('confirmarContrasena', 'fixture-local-only')
  await llenar('dni', 'abc'); await click('Crear cuenta'); await verTexto('El DNI debe tener 7 u 8 números')
  check(true, 'DNI inválido bloqueado antes de registrar')
  await llenar('dni', '98.765.432')
  await click('Mostrar contraseña'); check(await evaluar(`document.getElementById('contrasena').type==='text'&&document.getElementById('contrasena').value==='fixture-local-only'`), 'ojo conserva contraseña')
  await click('Ocultar contraseña'); await responsive('registro'); await click('Crear cuenta'); await verTexto('Tu cuenta fue creada.')
  check(!await evaluar(`sessionStorage.getItem('servimap-jwt')`), 'registro no inicia sesión implícitamente')
  const cliente = { email: 'registro@example.test', password: 'fixture-local-only' }
  fase = 'cliente'
  await login(cliente); await ir('/cliente'); await verTexto('Panel del cliente'); await cdp('Page.reload'); await verTexto('Panel del cliente')
  check(await evaluar(`!!sessionStorage.getItem('servimap-jwt')`), 'JWT persiste al recargar')
  await responsive('cliente'); await ir('/admin'); await verTexto('Acceso denegado'); check(true, 'cliente sin acceso administrativo')
  const cancelada = await crearSolicitud('QA solicitud a cancelar')
  await ir('/cliente/solicitudes'); await click('Preparar cancelación', cancelada); await click('Confirmar cancelación', cancelada); await verTexto('Cancelada')
  const finalizar = await crearSolicitud('QA solicitud a finalizar'), rechazar = await crearSolicitud('QA solicitud a rechazar')
  check(api.solicitudes.every((s) => s.prestadorId === idQA(101) && s.oficioId === idQA(201)), 'solicitudes usan IDs del backend')
  await logout(); check(true, 'logout local del cliente')
  fase = 'prestador'
  await login(CUENTAS_QA.PRESTADOR); await ir('/admin'); await verTexto('Acceso denegado'); check(true, 'prestador sin permisos administrativos')
  await ir('/prestador/perfil'); await click('Editar perfil')
  await llenar('telefono', '+54 11 4567-8901'); await llenar('whatsapp', '+54 11 4567-8901'); await llenar('emailContacto', 'contacto@example.test')
  await llenar('latitud', '-34.601234'); await llenar('longitud', '-58.381234'); await llenar('precioMin', '100'); await llenar('precioMax', '200')
  await responsive('perfil'); await click('Guardar cambios'); await verTexto('Perfil actualizado en el servidor.')
  check(api.perfil.latitud === -34.601234, 'perfil guarda ubicación privada solo en API simulada')
  await ir('/prestador/oficios'); await llenar('nuevo-oficio', idQA(202)); await click('Agregar oficio'); await click('Guardar oficios'); await verTexto('Oficios guardados en el servidor.')
  check(api.perfil.oficioIds.includes(idQA(202)), 'oficios guardados por ID')
  await ir('/prestador/solicitudes'); await click('Aceptar solicitud', finalizar); await click('Confirmar aceptación', finalizar)
  await hasta(`document.body.innerText.includes('Aceptada')`, 'aceptación confirmada')
  await click('Marcar trabajo como terminado', finalizar); await click('Confirmar trabajo terminado', finalizar); await verTexto('Finalizada')
  await click('Rechazar solicitud', rechazar); await click('Confirmar rechazo', rechazar); await verTexto('Rechazada')
  check(api.solicitudes.find((s) => s.id === finalizar).estado === 'FINALIZADA' && api.solicitudes.find((s) => s.id === rechazar).estado === 'RECHAZADA', 'prestador: aceptar, finalizar y rechazar')
  await responsive('solicitudes'); await logout()
  fase = 'calificación cliente'
  await login(cliente); await ir('/cliente/solicitudes'); await click('Calificar prestador', finalizar)
  await evaluar(`document.querySelector('input[type=radio][value="5"]').click()`); await llenar(`comentario-${finalizar}`, 'Comentario QA simulado'); await click('Enviar calificación'); await verTexto('La calificación fue registrada correctamente.')
  check(api.calificaciones.length === 1, 'calificación única de solicitud finalizada')
  await cdp('Page.reload'); await verTexto('Solicitudes realizadas')
  check(!await evaluar(`[...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='Calificar prestador')`), 'no permite duplicar calificación tras recarga')
  await logout()
  fase = 'administración'
  await login(CUENTAS_QA.ADMINISTRADOR); await ir('/cliente'); await verTexto('Acceso denegado'); check(true, 'administrador no suplanta rol cliente')
  await ir('/admin'); await verTexto('Comentario QA simulado')
  await click(`Ocultar comentario de Cliente ${api.calificaciones[0].clienteId}`); await llenar(`motivo-${api.calificaciones[0].id}`, 'Moderación QA'); await click('Confirmar'); await verTexto('Motivo: Moderación QA')
  check(api.calificaciones[0].moderada, 'administrador modera con motivo')
  await click('Administración de oficios'); await llenar('admin-oficio-nombre', 'Oficio QA'); await click('Crear oficio'); await verTexto('Oficio QA')
  await click('Editar Oficio QA'); await llenar('admin-oficio-nombre', 'Oficio QA editado'); await click('Guardar cambios'); await verTexto('Oficio QA editado')
  await click('Desactivar Oficio QA editado'); await click('Activar Oficio QA editado')
  check(api.oficios.some((o) => o.nombre === 'Oficio QA editado' && o.activo), 'administrador crea, edita y activa/desactiva')
  await responsive('administracion'); await logout()
  fase = 'mapa con marcador y privacidad'
  await ir('/'); await verTexto('QA PRESTADOR'); await hasta(`!!document.querySelector('.mapa-marcador')`, 'marcador público')
  await hasta(`document.querySelector('.mapa-interactivo')?.getAttribute('aria-busy')==='false'`, 'mapa con marcador cargado', 25000)
  await cdp('Browser.grantPermissions', { origin: new URL(base).origin, permissions: ['geolocation'] })
  await cdp('Emulation.setGeolocationOverride', { latitude: -34.62, longitude: -58.4, accuracy: 25 })
  await click('Usar mi ubicación'); await verTexto('Ubicación obtenida correctamente.'); await click('Centrar en mi ubicación')
  check(await evaluar(`!!document.querySelector('.mapa-ubicacion')`), 'geolocalización simulada y recentrado, sin usar ubicación personal')
  const mapa = api.responder({ method: 'GET', url: `${API_SIMULADA_ORIGIN}/api/prestadores/mapa` }).body[0]
  check(mapa.latitud === -34.6 && mapa.longitud === -58.38, 'coordenadas públicas redondeadas, distintas de las privadas')
  await evaluar(`document.querySelector('.mapa-marcador').click()`); await verTexto('Cómo llegar en Google Maps')
  await evaluar(`document.querySelector('.mapa-info a').scrollIntoView({block:'center'})`)
  await hasta(`(()=>{const a=document.querySelector('.mapa-info a'),m=document.querySelector('.mapa-interactivo'),c=document.querySelector('.maplibregl-ctrl-attrib');if(!a||!m||!c)return false;const r=a.getBoundingClientRect(),b=m.getBoundingClientRect(),creditos=c.getBoundingClientRect();return r.top>=b.top&&r.bottom<=creditos.top&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===a})()`, 'indicaciones visibles sin recorte ni superposición')
  check(true, 'popup móvil: indicaciones visibles fuera de los créditos')
  check(await evaluar(`document.querySelector('.mapa-info a').rel.includes('noopener')&&document.querySelector('.mapa-info a').target==='_blank'`), 'indicaciones externas seguras')
  await captura('mapa-marcador'); await click('Ver perfil'); await verTexto('QA PRESTADOR')
  check(!await evaluar(`document.body.innerText.includes('Comentario QA simulado')`), 'comentario moderado no aparece en ficha pública')
  fase = 'expiración y errores'
  api.expirarSiguienteLogin(); await login(cliente); await ir('/cliente'); await hasta(`location.pathname==='/login'`, 'expiración redirige a login', 7000)
  check(!await evaluar(`sessionStorage.getItem('servimap-jwt')`), 'JWT vencido eliminado')
  await ir('/admin'); await hasta(`location.pathname==='/login'`, 'ruta privada sin JWT')
  await evaluar(`sessionStorage.setItem('servimap-jwt','fixture-malformado')`); await ir('/cliente'); await hasta(`location.pathname==='/login'`, 'JWT malformado rechazado')
  check(!await evaluar(`sessionStorage.getItem('servimap-jwt')`), 'JWT malformado eliminado sin intentar autenticarlo')
  for (const status of [400, 401, 403, 404, 409, 500]) {
    api.forzarError('GET', '/api/solicitudes', status)
    const obtenido = await evaluar(`(async()=>{try{const {apiRequest}=await import('/src/services/apiClient.js');await apiRequest('/api/solicitudes');return 0}catch(e){return e.status}})()`)
    check(obtenido === status, `manejo HTTP ${status} con API simulada`)
  }
  await ir('/login'); await llenar('email', 'nadie@example.test'); await llenar('contrasena', 'fixture-local-only'); await click('Iniciar sesión'); await verTexto('Email o contraseña incorrectos')
  await responsive('login')
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab' }); await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab' })
  check(await evaluar(`['A','BUTTON','INPUT','SELECT','TEXTAREA','SUMMARY'].includes(document.activeElement.tagName)`), 'navegación básica mediante teclado')
  check(reporte.erroresConsola.length === 0, 'sin excepciones JavaScript en navegador')
  check(reporte.recursosFallidos.length === 0, 'recursos frontend y cartográficos sin errores de red ni HTTP')
  check(reporte.escriturasBloqueadas.length === 0, 'sin escrituras fuera del interceptor')
  check(nav >= 44, 'navegación pública con objetivos táctiles separados de al menos 44px')
  reporte.aprobado = true
} catch (error) {
  reporte.aprobado = false; reporte.faseFallida = fase; reporte.error = error.message
  if (ws?.readyState === WebSocket.OPEN) await captura('fallo').catch(() => {})
  process.exitCode = 1
} finally {
  reporte.llamadasSimuladas = api.llamadas
  writeFileSync(path.join(carpeta, 'resultado.json'), JSON.stringify(reporte, null, 2))
  console.log(JSON.stringify({ aprobado: reporte.aprobado, verificaciones: reporte.verificaciones.length, faseFallida: reporte.faseFallida, error: reporte.error, alturaNavegacion: reporte.alturaNavegacion, erroresJavaScript: reporte.erroresConsola.length, llamadasSimuladas: api.llamadas.length, escriturasSimuladas: api.llamadas.filter((r) => !['GET','OPTIONS'].includes(r.method)).length, reporte: path.join(carpeta, 'resultado.json') }))
  if (ws?.readyState === WebSocket.OPEN) { await cdp('Browser.close').catch(() => {}); ws.close() } else proceso.kill()
}
