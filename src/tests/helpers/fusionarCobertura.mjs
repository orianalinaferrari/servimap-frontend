import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseAstAsync } from 'vite'
import convert from 'ast-v8-to-istanbul'
import { createCoverageMap } from '@vitest/istanbul-lib-coverage'
import { create, createContext } from '@vitest/istanbul-lib-report'

// Same AST converter and Istanbul representation as @vitest/coverage-v8.
// Only merge files already present in the full unit-test inventory.
export async function fusionarCobertura(unitaria, ejecuciones) {
  const map = createCoverageMap(unitaria)
  const inventory = new Set(map.files())
  const denominadores = new Map(map.files().map(file => [file, map.fileCoverageFor(file).toSummary()]))
  for (const ejecucion of ejecuciones) {
    for (const script of ejecucion.result) {
      if (!script.url.startsWith('file:')) continue
      const filename = fileURLToPath(script.url)
      if (!inventory.has(filename)) continue
      const code = readFileSync(filename, 'utf8')
      const data = await convert({ ast: await parseAstAsync(code), code, wrapperLength: 0, coverage: script })
      // Unit reports crossed the JSON boundary too: open-ended columns (Infinity)
      // serialize as null. Use the same representation to avoid duplicate branches.
      map.merge(JSON.parse(JSON.stringify(data)))
    }
  }
  assert.deepEqual(map.files().sort(), [...inventory].sort(), 'Coverage inventory changed')
  for (const file of inventory) {
    const before = denominadores.get(file)
    const after = map.fileCoverageFor(file).toSummary()
    for (const metric of ['lines', 'branches', 'functions', 'statements']) {
      assert.equal(after[metric].total, before[metric].total, `${file}: ${metric} denominator changed`)
    }
  }
  return map
}

export function guardarCobertura(map, dir) {
  const context = createContext({ dir, coverageMap: map })
  for (const reporter of ['lcovonly', 'json-summary', 'json', 'text-summary']) {
    create(reporter).execute(context)
  }
}
