// Solo GET/OPTIONS a rutas fijas: nunca login, registro ni escrituras reales.
import assert from 'node:assert/strict'

const api = 'https://servimap-backend.vercel.app'
const local = 'http://localhost:5173'
const resultados = []
async function consultar(ruta, method, headers) {
  assert.ok(['GET', 'OPTIONS'].includes(method))
  return fetch(api + ruta, { method, headers, redirect: 'error', signal: AbortSignal.timeout(20000) })
}

for (const [ruta, method] of [
  ['/api/auth/login', 'POST'], ['/api/auth/register', 'POST'],
  ['/api/auth/me', 'GET'], ['/api/prestadores/me', 'PUT'],
  ['/api/prestadores/me/oficios', 'PUT'], ['/api/solicitudes', 'POST'],
  ['/api/calificaciones', 'POST'], ['/api/oficios', 'POST'],
  ['/api/solicitudes/:id/aceptar', 'PATCH'],
  ['/api/oficios/:id/estado', 'PATCH'],
  ['/api/calificaciones/:id/moderacion', 'PATCH'],
]) {
  // Access-Control-Request-Method describe la operación; NO la ejecuta.
  const r = await consultar(ruta, 'OPTIONS', {
    Origin: local, 'Access-Control-Request-Method': method,
    'Access-Control-Request-Headers': 'authorization,content-type',
  })
  assert.equal(r.status, 204, ruta)
  assert.equal(r.headers.get('access-control-allow-origin'), local, ruta)
  const permitidos = r.headers.get('access-control-allow-headers')?.toLowerCase().split(',').map((valor) => valor.trim())
  assert.ok(permitidos?.includes('authorization') && permitidos.includes('content-type'), ruta)
  assert.ok(r.headers.get('access-control-allow-methods')?.split(',').map((valor) => valor.trim()).includes(method), ruta)
  assert.match(r.headers.get('vary') || '', /origin/i)
  resultados.push({ ruta, preflight: method, status: r.status })
}

for (const origen of ['http://localhost:5174', 'https://qa-origin.example.test', 'null']) {
  const r = await consultar('/api/auth/me', 'OPTIONS', {
    Origin: origen, 'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'authorization',
  })
  assert.ok(!['*', origen].includes(r.headers.get('access-control-allow-origin')), origen)
  resultados.push({ origen, corsDenegado: true, status: r.status })
}

for (const ruta of ['/api/auth/me', '/api/prestadores/me', '/api/prestadores/me/calificaciones', '/api/solicitudes', '/api/oficios/todos', '/api/calificaciones']) {
  for (const invalido of [false, true]) {
    // Cadena deliberadamente malformada, sin firma, identidad ni credenciales.
    const r = await consultar(ruta, 'GET', { Origin: local, ...(invalido ? { Authorization: 'Bearer qa-invalid-not-a-jwt' } : {}) })
    assert.equal(r.status, 401, ruta)
    assert.equal(r.headers.get('access-control-allow-origin'), local, ruta)
    const dato = await r.json()
    assert.equal(typeof dato.error, 'string')
    assert.deepEqual(Object.keys(dato), ['error'], 'El rechazo no debe exponer datos privados')
    resultados.push({ ruta, credencial: invalido ? 'malformada' : 'ausente', status: r.status })
  }
}
console.log(JSON.stringify({ tipo: 'CORS y rechazos reales; solo GET/OPTIONS', verificaciones: resultados.length, resultados }))
