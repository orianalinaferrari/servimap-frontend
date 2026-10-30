import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import process from 'node:process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseAstAsync } from 'vite'
import convert from 'ast-v8-to-istanbul'
import { fusionarCobertura } from './helpers/fusionarCobertura.mjs'

let folder, unit, cliente, prestador
beforeAll(async () => {
  folder = mkdtempSync(path.join(os.tmpdir(), 'servimap-fusion-'))
  const file = path.join(folder, 'permisos.mjs')
  const code = "export function permitir(rol) {\n if (rol === 'CLIENTE') return 'permitido'\n return 'denegado'\n}\nconsole.log(permitir(process.argv[2]))\n"
  writeFileSync(file, code)
  unit = JSON.parse(JSON.stringify(await convert({ ast: await parseAstAsync(code), code, wrapperLength: 0, coverage: { url: pathToFileURL(file).href, functions: [] } })))
  const ejecutar = rol => {
    const raw = path.join(folder, rol)
    mkdirSync(raw)
    execFileSync(process.execPath, [file, rol], { env: { ...process.env, NODE_V8_COVERAGE: raw }, windowsHide: true })
    return JSON.parse(readFileSync(path.join(raw, readdirSync(raw).find(name => name.endsWith('.json'))), 'utf8'))
  }
  cliente = ejecutar('CLIENTE')
  prestador = ejecutar('PRESTADOR')
})
afterAll(() => {
  // Only delete the explicitly created direct child of the temporary directory.
  if (folder && path.dirname(path.resolve(folder)) === path.resolve(os.tmpdir()) && path.basename(folder).startsWith('servimap-fusion-')) {
    rmSync(folder, { recursive: true, force: true })
  }
})

describe('Fusión de cobertura nativa sin alterar el denominador', () => {
  it('solo cubre la rama realmente ejecutada', async () => {
    const map = await fusionarCobertura(unit, [cliente])
    expect(map.getCoverageSummary().branches.pct).toBe(50)
    expect(map.files()).toEqual(Object.keys(unit))
  })
  it('combina ambas decisiones sin duplicar condiciones ni líneas', async () => {
    const partial = await fusionarCobertura(unit, [cliente])
    const complete = await fusionarCobertura(unit, [cliente, prestador])
    expect(complete.getCoverageSummary().branches.pct).toBe(100)
    expect(complete.getCoverageSummary().branches.total).toBe(partial.getCoverageSummary().branches.total)
    expect(complete.getCoverageSummary().lines.total).toBe(partial.getCoverageSummary().lines.total)
  })
  it('no agrega runtime ni dependencias al inventario original', async () => {
    const map = await fusionarCobertura(unit, [cliente, { result: [{ url: 'node:internal/test', functions: [] }] }])
    expect(map.files()).toEqual(Object.keys(unit))
  })
})
