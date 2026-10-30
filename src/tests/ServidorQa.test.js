import { afterEach, describe, expect, it, vi } from 'vitest'
import { createServer } from 'node:http'
import { mkdtempSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { iniciarServidorQa } from './helpers/servidorQa.mjs'

const recursos = []
afterEach(async () => {
  for (const cerrar of recursos.splice(0).reverse()) await cerrar()
  vi.unstubAllEnvs()
})

function sitio() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'servimap-vite-'))
  writeFileSync(path.join(root, 'index.html'), '<!doctype html><div id="root">QA</div>')
  return root
}

describe('Disponibilidad real del servidor QA', () => {
  it('inicia con entorno CI/color y puerto asignado sin leer stdout', async () => {
    vi.stubEnv('CI', 'true')
    vi.stubEnv('FORCE_COLOR', '1')
    const { server, url } = await iniciarServidorQa({ root: sitio(), configFile: false })
    recursos.push(() => server.close())
    expect(new URL(url).hostname).toBe('127.0.0.1')
    expect(Number(new URL(url).port)).toBeGreaterThan(0)
    expect(server.httpServer.listening).toBe(true)
  })
  it('asigna puertos diferentes y permite cerrar ambos servidores', async () => {
    const first = await iniciarServidorQa({ root: sitio(), configFile: false })
    recursos.push(() => first.server.close())
    const second = await iniciarServidorQa({ root: sitio(), configFile: false })
    recursos.push(() => second.server.close())
    expect(first.url).not.toBe(second.url)
    await first.server.close()
    expect(first.server.httpServer.listening).toBe(false)
  })
  it('propaga puerto ocupado inmediatamente en vez de esperar el timeout de logs', async () => {
    const ocupado = createServer()
    await new Promise(resolve => ocupado.listen(0, '127.0.0.1', resolve))
    recursos.push(() => new Promise(resolve => ocupado.close(resolve)))
    await expect(iniciarServidorQa({ root: sitio(), configFile: false, port: ocupado.address().port })).rejects.toThrow(/already in use/)
  })
  it('rechaza un servidor sin índice HTTP utilizable', async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'servimap-vite-sin-index-'))
    await expect(iniciarServidorQa({ root, configFile: false })).rejects.toThrow('Vite readiness HTTP 404')
  })
  it('compila el origen simulado sin depender de un .env.local privado', async () => {
    const root = sitio()
    writeFileSync(path.join(root, '.env.local'), 'VITE_API_URL=https://private.example.test')
    writeFileSync(path.join(root, 'qa.js'), 'export const api = import.meta.env.VITE_API_URL')
    const { server } = await iniciarServidorQa({ root, configFile: false, apiOrigin: 'https://fixture.example.test' })
    recursos.push(() => server.close())
    const transformed = await server.transformRequest('/qa.js')
    expect(transformed.code).toContain('https://fixture.example.test')
    expect(transformed.code).not.toContain('https://private.example.test')
    expect(server.config.envDir).toBe(false)
  })
})
