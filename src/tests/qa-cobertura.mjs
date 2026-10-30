// Integration test harness: all API writes in navegador.mjs are intercepted.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fusionarCobertura, guardarCobertura } from './helpers/fusionarCobertura.mjs'
import { iniciarServidorQa } from './helpers/servidorQa.mjs'

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

const { server, url } = await iniciarServidorQa({ root })
try {
  const env = { ...process.env, NODE_V8_COVERAGE: raw, SERVIMAP_QA_BASE_URL: url }
  // Fix the full scenario: never inherit a developer's shortened landing scope.
  delete env.SERVIMAP_QA_SCOPE
  await ejecutar('scripts/qa/navegador.mjs', [], env)
  await ejecutar('scripts/qa/build-estatico.mjs', [], env)
} finally {
  await server.close()
}
const runs = readdirSync(raw).filter(file => file.endsWith('.json')).map(file => JSON.parse(readFileSync(path.join(raw, file), 'utf8')))
assert.ok(runs.length, 'No native V8 execution reports collected')
const map = await fusionarCobertura(unit, runs)
guardarCobertura(map, directory)
console.log(JSON.stringify({ coberturaFusionada: true, ejecuciones: runs.length, fuentes: map.files().length }))
