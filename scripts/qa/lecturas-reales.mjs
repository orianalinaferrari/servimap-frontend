// Verificación real estrictamente de lectura: no admite métodos ni rutas por CLI.
// Sin SERVIMAP_QA_LECTURAS_API consulta el backend publicado; con ella, solo una fixture loopback de QA.
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { configuracionLecturasQa } from './protocolo-cdp.mjs'

const PUBLICAS = ['/health', '/api/oficios', '/api/prestadores?limit=50', '/api/prestadores/mapa']
const PROTEGIDAS = ['/api/auth/me', '/api/solicitudes', '/api/calificaciones', '/api/oficios/todos']

export async function verificarLecturas({ origin, web }) {
  const headers = { Origin: web }
  const leer = (ruta) => fetch(origin + ruta, { method: 'GET', headers, redirect: 'error', signal: AbortSignal.timeout(20000) })
  const resultados = []
  let prestadorId
  for (const ruta of [...PUBLICAS, ...PROTEGIDAS]) {
    const response = await leer(ruta)
    const dato = await response.json(), protegido = PROTEGIDAS.includes(ruta)
    assert.equal(response.status, protegido ? 401 : 200, ruta)
    assert.equal(response.headers.get('access-control-allow-origin'), headers.Origin, `CORS ${ruta}`)
    if (protegido) assert.equal(typeof dato.error, 'string')
    else if (ruta === '/health') assert.equal(dato.status, 'ok')
    else {
      assert.ok(Array.isArray(dato), ruta)
      for (const item of dato) {
        assert.equal(typeof item.id, 'string')
        for (const privada of ['dni', 'password', 'passwordHash', 'token']) assert.ok(!(privada in item), `${ruta}: ${privada}`)
        if (ruta === '/api/oficios') { assert.equal(typeof item.nombre, 'string'); assert.equal(typeof item.activo, 'boolean') }
        if (ruta.startsWith('/api/prestadores?')) { assert.ok(Array.isArray(item.oficios)); assert.ok(item.reputacion); prestadorId ||= item.id }
        if (ruta === '/api/prestadores/mapa') for (const campo of ['latitud', 'longitud']) { assert.equal(typeof item[campo], 'number'); assert.equal(Number(item[campo].toFixed(2)), item[campo]) }
      }
    }
    resultados.push({ ruta, status: response.status, cors: true, elementos: Array.isArray(dato) ? dato.length : undefined })
  }
  if (prestadorId) {
    const response = await leer(`/api/prestadores/${encodeURIComponent(prestadorId)}`)
    const dato = await response.json()
    assert.equal(response.status, 200); assert.equal(dato.id, prestadorId); assert.ok(Array.isArray(dato.comentarios)); assert.ok(dato.reputacion)
    resultados.push({ ruta: '/api/prestadores/:id', status: response.status, estructura: true })
  }
  return resultados
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { local, api, web } = configuracionLecturasQa()
  const resultados = await verificarLecturas({ origin: api, web })
  console.log(JSON.stringify({ tipo: local ? 'GET contra fixture local de QA, sin escrituras' : 'GET reales sin credenciales ni escrituras', resultados }))
}
