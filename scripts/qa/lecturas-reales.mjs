// Verificación real estrictamente de lectura: no admite métodos ni rutas por CLI.
import assert from 'node:assert/strict'
const origin = 'https://servimap-backend.vercel.app'
const headers = { Origin: 'http://localhost:5173' }
const resultados = []
let prestadorId
for (const ruta of ['/health','/api/oficios','/api/prestadores?limit=50','/api/prestadores/mapa','/api/auth/me','/api/solicitudes','/api/calificaciones','/api/oficios/todos']) {
  const response = await fetch(origin + ruta, { method: 'GET', headers, redirect: 'error', signal: AbortSignal.timeout(20000) })
  const dato = await response.json(), protegido = ['/api/auth/me','/api/solicitudes','/api/calificaciones','/api/oficios/todos'].includes(ruta)
  assert.equal(response.status, protegido ? 401 : 200, ruta)
  assert.equal(response.headers.get('access-control-allow-origin'), headers.Origin, `CORS ${ruta}`)
  if (protegido) assert.equal(typeof dato.error, 'string')
  else if (ruta === '/health') assert.equal(dato.status, 'ok')
  else {
    assert.ok(Array.isArray(dato), ruta)
    for (const item of dato) {
      assert.equal(typeof item.id, 'string')
      for (const privada of ['dni','password','passwordHash','token']) assert.ok(!(privada in item), `${ruta}: ${privada}`)
      if (ruta === '/api/oficios') { assert.equal(typeof item.nombre, 'string'); assert.equal(typeof item.activo, 'boolean') }
      if (ruta.startsWith('/api/prestadores?')) { assert.ok(Array.isArray(item.oficios)); assert.ok(item.reputacion); prestadorId ||= item.id }
      if (ruta === '/api/prestadores/mapa') for (const campo of ['latitud','longitud']) { assert.equal(typeof item[campo], 'number'); assert.equal(Number(item[campo].toFixed(2)), item[campo]) }
    }
  }
  resultados.push({ ruta, status: response.status, cors: true, elementos: Array.isArray(dato) ? dato.length : undefined })
}
if (prestadorId) {
  const response = await fetch(`${origin}/api/prestadores/${encodeURIComponent(prestadorId)}`, { method: 'GET', headers, redirect: 'error', signal: AbortSignal.timeout(20000) })
  const dato = await response.json()
  assert.equal(response.status, 200); assert.equal(dato.id, prestadorId); assert.ok(Array.isArray(dato.comentarios)); assert.ok(dato.reputacion)
  resultados.push({ ruta: '/api/prestadores/:id', status: response.status, estructura: true })
}
console.log(JSON.stringify({ tipo: 'GET reales sin credenciales ni escrituras', resultados }))
