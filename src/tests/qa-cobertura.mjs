// Integration test harness: all API writes in navegador.mjs are intercepted.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fusionarCobertura, guardarCobertura } from './helpers/fusionarCobertura.mjs'

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

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', 'localhost', '--port', '5173', '--strictPort'], {
  cwd: root, env: process.env, shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
})
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Local Vite startup timed out')), 20000)
    const ready = (chunk) => {
      if (chunk.toString().includes('http://localhost:5173')) { clearTimeout(timer); resolve() }
    }
    server.stdout.on('data', ready)
    server.stderr.on('data', chunk => process.stderr.write(chunk))
    server.once('error', error => { clearTimeout(timer); reject(error) })
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`Vite exited: ${code}`)) })
  })
  const env = { ...process.env, NODE_V8_COVERAGE: raw, SERVIMAP_QA_BASE_URL: 'http://localhost:5173' }
  // Fix the full scenario: never inherit a developer's shortened landing scope.
  delete env.SERVIMAP_QA_SCOPE
  await ejecutar('scripts/qa/navegador.mjs', [], env)
  await ejecutar('scripts/qa/build-estatico.mjs', [], env)
} finally {
  const stopped = new Promise(resolve => {
    if (!server.pid || server.exitCode !== null || server.signalCode !== null) resolve()
    else server.once('exit', resolve)
  })
  server.kill()
  await stopped
}
const runs = readdirSync(raw).filter(file => file.endsWith('.json')).map(file => JSON.parse(readFileSync(path.join(raw, file), 'utf8')))
assert.ok(runs.length, 'No native V8 execution reports collected')
const map = await fusionarCobertura(unit, runs)
guardarCobertura(map, directory)
console.log(JSON.stringify({ coberturaFusionada: true, ejecuciones: runs.length, fuentes: map.files().length }))
