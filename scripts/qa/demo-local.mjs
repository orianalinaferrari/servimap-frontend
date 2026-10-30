// Servidor de demos QA aislado: no se importa desde src ni reenvia trafico.
import { createServer as crearHttp } from 'node:http'
import { createServer as crearVite } from 'vite'
import { CUENTAS_QA } from './api-simulada.mjs'

const textoAviso = (escenario, rol) => `${escenario ? `Escenario: ${escenario}. DEMO QA` : 'DEMO LOCAL'} — DATOS FICTICIOS. Sesión ${rol} de prueba. Todas las acciones se simulan en memoria; no uses credenciales reales. Reiniciá el comando para restablecer los datos.`

// `origenes` ({ api, web }) se lee en cada petición: permite fijar orígenes de puertos dinámicos.
export function crearServidorApiQa(api, origenes) {
return crearHttp(async (req, res) => {
  const { api: apiOrigin, web: webOrigin } = origenes
  // Nunca reenviar peticiones: todas las rutas se resuelven en la fixture local.
  res.setHeader('Cache-Control', 'no-store')
  if (req.headers.host !== new URL(apiOrigin).host || (req.headers.origin && req.headers.origin !== webOrigin)) {
    res.writeHead(403).end()
    return
  }
  res.setHeader('Access-Control-Allow-Origin', webOrigin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type')
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return }
  if (!['GET', 'POST', 'PUT', 'PATCH'].includes(req.method)) { res.writeHead(405).end(); return }
  if (req.method !== 'GET' && req.headers.origin !== webOrigin) { res.writeHead(403).end(); return }
  try {
    let raw = ''
    for await (const chunk of req) {
      raw += chunk
      if (Buffer.byteLength(raw) > 65536) { res.writeHead(413).end(); return }
    }
    const resultado = api.responder({ method: req.method, url: new URL(req.url, apiOrigin).href, headers: req.headers, body: raw ? JSON.parse(raw) : undefined })
    res.writeHead(resultado.status, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify(resultado.body))
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Petición de prueba inválida' }))
  }
})
}

export async function iniciarDemo({ api, rol, puertoWeb, puertoApi, escenario, rutaInicial, avisoId = `qa-${rol.toLowerCase()}-aviso`, restringirConexiones = true }) {
const webOrigin = `http://127.0.0.1:${puertoWeb}`
const apiOrigin = `http://127.0.0.1:${puertoApi}`
const apiServer = crearServidorApiQa(api, { api: apiOrigin, web: webOrigin })

let vite
try {
  await new Promise((resolve, reject) => { apiServer.once('error', reject); apiServer.listen(puertoApi, '127.0.0.1', resolve) })
  vite = await crearVite({
    envDir: false,
    define: { 'import.meta.env.VITE_API_URL': JSON.stringify(apiOrigin) },
    server: { host: '127.0.0.1', port: puertoWeb, strictPort: true, allowedHosts: ['127.0.0.1'] },
    plugins: [{
      name: 'servimap-qa-local',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.headers.host !== new URL(webOrigin).host) { res.writeHead(403).end(); return }
          next()
        })
      },
      transformIndexHtml(html) {
        // Token de las fixtures ya existentes; su firma no es válida en producción.
        const sesion = api.responder({ method: 'POST', url: apiOrigin + '/api/auth/login', body: CUENTAS_QA[rol] })
        if (sesion.status !== 200) throw new Error('No se pudo preparar la sesión de QA')
        return { html, tags: [
          // Solo la demo restringe conexiones a loopback y cartografia.
          ...(restringirConexiones ? [{ tag: 'meta', injectTo: 'head-prepend', attrs: {
            'http-equiv': 'Content-Security-Policy',
            content: `connect-src 'self' ${apiOrigin} ${webOrigin.replace('http:', 'ws:')} https://tiles.openfreemap.org; form-action 'self';`,
          } }] : []),

          { tag: 'script', injectTo: 'head-prepend', children: `sessionStorage.setItem('servimap-jwt',${JSON.stringify(sesion.body.token)});` },
          { tag: 'aside', injectTo: 'body-prepend', attrs: { id: avisoId, role: 'note' }, children: textoAviso(escenario, rol) },
          { tag: 'style', injectTo: 'head', children: `#${avisoId}{padding:10px 20px;background:#fff0c9;color:#573e08;font:600 13px/1.5 system-ui;border-bottom:1px solid #e2cb8e}` },
        ] }
      },
    }],
  })
  await vite.listen()
  console.log(`DEMO ${rol}: ${webOrigin}${rutaInicial}\nAPI ficticia: ${apiOrigin}${escenario ? `\nEscenario: ${escenario} ` : ''}\nSolo datos en memoria; detener con Ctrl+C. No hay acceso a producción.`)
} catch (error) {
  apiServer.close()
  await vite?.close()
  throw error
}
async function cerrar() {
  await vite.close()
  apiServer.close()
}
process.once('SIGINT', cerrar)
process.once('SIGTERM', cerrar)

return { vite, apiServer, cerrar }
}
