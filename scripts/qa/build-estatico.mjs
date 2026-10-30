// Smoke del artefacto compilado; no abre formularios ni contacta la API.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { preview } from 'vite'

const index = readFileSync('dist/index.html', 'utf8')
const rutas = [...readFileSync('src/routes/AppRoutes.jsx', 'utf8').matchAll(/path="([^"]+)"/g)].map((r) => r[1] === '*' ? '/qa-ruta-inexistente' : r[1])
const archivos = readdirSync('dist', { recursive: true, withFileTypes: true }).filter((f) => f.isFile()).map((f) => path.relative('dist', path.join(f.parentPath, f.name)).replaceAll('\\', '/'))
assert.ok(archivos.some((f) => /^assets\/maplibre-gl-worker-.*\.js$/.test(f)), 'Worker MapLibre emitido')
assert.ok(!archivos.some((f) => /(?:(^|\/)(\.env|\.git|\.vercel)|\.map$)/.test(f)), 'Sin archivos privados ni sourcemaps en dist')
const js = archivos.filter((f) => f.endsWith('.js')).map((f) => readFileSync(`dist/${f}`, 'utf8')).join('\n')
assert.ok(js.includes('https://servimap-backend.vercel.app'), 'API pública incorporada en build')
assert.ok(!/postgres(?:ql)?:\/\/|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|github_pat_[A-Za-z0-9_]+/.test(js), 'Sin patrones de secretos en JS')

const server = await preview({ preview: { host: '127.0.0.1', port: 0, strictPort: true } })
try {
  const address = server.httpServer.address()
  assert.ok(address && typeof address === 'object', 'Preview inició en puerto exclusivo')
  const base = `http://127.0.0.1:${address.port}`
  for (const ruta of rutas) {
    const r = await fetch(base + ruta, { redirect: 'error' })
    assert.equal(r.status, 200, ruta)
    assert.equal(await r.text(), index, `Fallback SPA ${ruta}`)
  }
  for (const archivo of archivos) {
    const r = await fetch(`${base}/${archivo}`, { redirect: 'error' })
    assert.equal(r.status, 200, archivo)
    if (archivo.endsWith('.js')) assert.match(r.headers.get('content-type'), /javascript/)
    if (archivo.endsWith('.css')) assert.match(r.headers.get('content-type'), /text\/css/)
    if (archivo.endsWith('.svg')) assert.match(r.headers.get('content-type'), /image\/svg\+xml/)
    if (archivo !== 'index.html') assert.notEqual(await r.text(), index, `Asset no reescrito: ${archivo}`)
  }
  console.log(JSON.stringify({ aprobado: true, node: process.version, rutasSPA: rutas.length, archivos: archivos.length, workerMapLibre: true, apiPublica: true, tipo: 'Artefacto local con Vite preview; no certifica routing remoto Vercel' }))
} finally {
  await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()))
}
