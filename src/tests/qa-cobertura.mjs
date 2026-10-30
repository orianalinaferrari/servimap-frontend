// Integration test harness: all API writes in navegador.mjs are intercepted.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fusionarCobertura, guardarCobertura } from './helpers/fusionarCobertura.mjs'
import { iniciarServidorQa } from './helpers/servidorQa.mjs'
import { API_SIMULADA_ORIGIN, crearApiSimulada } from '../../scripts/qa/api-simulada.mjs'
import { crearServidorApiQa } from '../../scripts/qa/demo-local.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
assert.equal(path.resolve(process.cwd()), path.resolve(root), 'Run from the frontend root')
const directory = path.join(root, 'coverage')
const unitFile = path.join(directory, 'coverage-unit.json')
const unit = JSON.parse(readFileSync(unitFile, 'utf8'))
writeFileSync(path.join(directory, 'coverage-unit-summary.json'), readFileSync(path.join(directory, 'coverage-summary.json')))
mkdirSync(directory, { recursive: true })
const raw = mkdtempSync(path.join(directory, 'qa-v8-'))

function ejecutar(file, args = [], env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [file, ...args], { cwd: root, env, shell: false, windowsHide: true, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`${file}: exit ${code}, signal ${signal}`)))
  })
}

async function esperarDemo(demo, url, timeoutMs = 60000) {
  const limite = Date.now() + timeoutMs
  while (Date.now() < limite) {
    if (demo.exitCode !== null) throw new Error(`${url}: la demo terminó antes de estar disponible (exit ${demo.exitCode})`)
    try { if ((await fetch(url, { signal: AbortSignal.timeout(5000) })).ok) return } catch { /* Todavía iniciando. */ }
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  throw new Error(`${url}: la demo no respondió a tiempo`)
}

async function detenerDemo(demo) {
  if (demo.exitCode !== null || demo.signalCode !== null) return
  const salida = new Promise(resolve => demo.once('exit', resolve))
  // SIGTERM permite cerrar Vite/API y volcar la cobertura V8 del proceso.
  demo.kill('SIGTERM')
  const forzado = setTimeout(() => demo.kill('SIGKILL'), 10000)
  await salida
  clearTimeout(forzado)
}

// Demos con API simulada en memoria y puertos loopback fijos; cada runner verifica su propio escenario.
const DEMOS = [
  { rol: 'cliente', url: 'http://127.0.0.1:4194/cliente' },
  { rol: 'prestador', url: 'http://127.0.0.1:4192/prestador' },
]

const { server, url } = await iniciarServidorQa({ root, apiOrigin: API_SIMULADA_ORIGIN })
const env = { ...process.env, NODE_V8_COVERAGE: raw, SERVIMAP_QA_BASE_URL: url }
// Fix the full scenario: never inherit a developer's shortened landing scope.
delete env.SERVIMAP_QA_SCOPE
try {
  await ejecutar('scripts/qa/navegador.mjs', [], env)
  await ejecutar('scripts/qa/build-estatico.mjs', [], env)
} finally {
  await server.close()
}
for (const demo of DEMOS) {
  const proceso = spawn(process.execPath, [`scripts/qa/${demo.rol}-demo.mjs`], { cwd: root, env, shell: false, windowsHide: true, stdio: ['ignore', 'ignore', 'inherit'] })
  try {
    await esperarDemo(proceso, demo.url)
    await ejecutar(`scripts/qa/${demo.rol}-navegador.mjs`, [], env)
  } finally {
    await detenerDemo(proceso)
  }
}
// Modo local explícito de las lecturas: fixture loopback sobre la API simulada, nunca el backend publicado.
const origenes = {}
const apiLecturas = crearServidorApiQa(crearApiSimulada(), origenes)
await new Promise((resolve, reject) => { apiLecturas.once('error', reject); apiLecturas.listen(0, '127.0.0.1', resolve) })
origenes.api = `http://127.0.0.1:${apiLecturas.address().port}`
try {
  const lecturas = await iniciarServidorQa({ root, apiOrigin: origenes.api })
  origenes.web = lecturas.url
  try {
    const envLecturas = { ...env, SERVIMAP_QA_BASE_URL: lecturas.url, SERVIMAP_QA_LECTURAS_API: origenes.api }
    await ejecutar('scripts/qa/lecturas-reales.mjs', [], envLecturas)
    await ejecutar('scripts/qa/navegador-lecturas.mjs', [], envLecturas)
  } finally {
    await lecturas.server.close()
  }
} finally {
  await new Promise(resolve => apiLecturas.close(resolve))
}
const runs = readdirSync(raw).filter(file => file.endsWith('.json')).map(file => JSON.parse(readFileSync(path.join(raw, file), 'utf8')))
assert.ok(runs.length, 'No native V8 execution reports collected')
const map = await fusionarCobertura(unit, runs)
guardarCobertura(map, directory)
console.log(JSON.stringify({ coberturaFusionada: true, ejecuciones: runs.length, fuentes: map.files().length }))
