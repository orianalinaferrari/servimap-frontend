// Vista interactiva de QA: solo loopback, API en memoria y sesión sintética existente.
// No se importa desde src/ ni se incluye en el build de producción.
import { createServer as crearHttp } from 'node:http'
import { createServer as crearVite } from 'vite'
import { crearApiSimulada, CUENTAS_QA, idQA } from './api-simulada.mjs'

const webOrigin = 'http://127.0.0.1:4190'
const apiOrigin = 'http://127.0.0.1:4191'
const api = crearApiSimulada()
api.oficios[0].nombre = 'QA Plomería'
api.oficios[1].nombre = 'QA Electricidad'
api.oficios[1].activo = false
api.oficios.push({ id: idQA(203), nombre: 'QA Pintura', categoria: 'Prueba', activo: true })
api.calificaciones.push(
  { id: idQA(301), prestadorId: api.perfil.id, clienteId: idQA(1), clienteNombre: 'QA Cliente ficticio A', puntaje: 2, comentario: 'QA: comentario ficticio para practicar moderación.', moderada: false },
  { id: idQA(302), prestadorId: api.perfil.id, clienteId: idQA(2), clienteNombre: 'QA Cliente ficticio B', puntaje: 5, comentario: 'QA: segunda experiencia completamente simulada.', moderada: false },
  { id: idQA(303), prestadorId: api.perfil.id, clienteId: idQA(3), clienteNombre: 'QA Cliente ficticio C', puntaje: 1, comentario: 'QA: ejemplo oculto previamente.', moderada: true, motivoModeracion: 'QA: ejemplo de moderación previa' },
)

const apiServer = crearHttp(async (req, res) => {
  // Nunca reenviar peticiones: todas las rutas se resuelven en la fixture local.
  res.setHeader('Cache-Control', 'no-store')
  if (req.headers.host !== '127.0.0.1:4191' || (req.headers.origin && req.headers.origin !== webOrigin)) {
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

let vite
try {
  await new Promise((resolve, reject) => { apiServer.once('error', reject); apiServer.listen(4191, '127.0.0.1', resolve) })
  vite = await crearVite({
    envDir: false,
    define: { 'import.meta.env.VITE_API_URL': JSON.stringify(apiOrigin) },
    server: { host: '127.0.0.1', port: 4190, strictPort: true, allowedHosts: ['127.0.0.1'] },
    plugins: [{
      name: 'servimap-qa-admin-local',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.headers.host !== '127.0.0.1:4190') { res.writeHead(403).end(); return }
          next()
        })
      },
      transformIndexHtml(html) {
        // Token de las fixtures ya existentes; su firma no es válida en producción.
        const sesion = api.responder({ method: 'POST', url: apiOrigin + '/api/auth/login', body: CUENTAS_QA.ADMINISTRADOR })
        if (sesion.status !== 200) throw new Error('No se pudo preparar la sesión de QA')
        return { html, tags: [
          { tag: 'script', injectTo: 'head-prepend', children: `sessionStorage.setItem('servimap-jwt',${JSON.stringify(sesion.body.token)});` },
          { tag: 'aside', injectTo: 'body-prepend', attrs: { id: 'qa-admin-aviso', role: 'note' }, children: 'DEMO LOCAL — DATOS FICTICIOS. Sesión ADMINISTRADOR de prueba. Todas las acciones se simulan en memoria; no uses credenciales reales. Reiniciá el comando para restablecer los datos.' },
          { tag: 'style', injectTo: 'head', children: '#qa-admin-aviso{padding:10px 20px;background:#fff0c9;color:#573e08;font:600 13px/1.5 system-ui;border-bottom:1px solid #e2cb8e}' },
        ] }
      },
    }],
  })
  await vite.listen()
  console.log(`DEMO ADMINISTRADOR: ${webOrigin}/admin\nAPI ficticia: ${apiOrigin}\nSolo datos en memoria; detener con Ctrl+C. No hay acceso a producción.`)
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
