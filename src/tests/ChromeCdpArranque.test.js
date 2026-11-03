import { EventEmitter } from 'node:events'
import path from 'node:path'
import procesoNode from 'node:process'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ spawn: vi.fn(), exists: vi.fn(), read: vi.fn(), temp: vi.fn(), mkdir: vi.fn(), write: vi.fn() }))
vi.mock('node:child_process', async (original) => { const actual = await original(); return { ...actual, spawn: mocks.spawn, default: { ...actual.default, spawn: mocks.spawn } } })
vi.mock('node:fs', async (original) => {
  const actual = await original()
  const cambios = { existsSync: mocks.exists, readFileSync: mocks.read, mkdtempSync: mocks.temp, mkdirSync: mocks.mkdir, writeFileSync: mocks.write }
  return { ...actual, ...cambios, default: { ...actual.default, ...cambios } }
})
import { abrirChromeCdp } from '../../scripts/qa/chrome-cdp.mjs'

const pagina = { type: 'page', url: 'about:blank', webSocketDebuggerUrl: 'ws://127.0.0.1:43210/devtools/page/prueba' }
const completo = '43210\n/devtools/browser/prueba\n'
let procesos, numero, consola
function terminar(child, signal) { child.signalCode = signal; queueMicrotask(() => child.emit('close', null, signal)) }
beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset()
  procesos = []; numero = 0
  mocks.temp.mockImplementation((prefijo) => `${prefijo}${++numero}`)
  mocks.exists.mockReturnValue(true)
  mocks.read.mockReturnValue(completo)
  mocks.spawn.mockImplementation(() => {
    const child = new EventEmitter()
    Object.assign(child, { pid: 12340 + procesos.length, exitCode: null, signalCode: null, stderr: new EventEmitter() })
    child.kill = vi.fn((signal) => { terminar(child, signal); return true })
    procesos.push(child); return child
  })
  // Nunca enviar señales a procesos reales desde los dobles de pruebas en Linux.
  vi.spyOn(procesoNode, 'kill').mockImplementation((pid, signal) => { const child = procesos.find((p) => p.pid === -pid); child.kill(signal); return true })
  consola = vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.stubEnv('SERVIMAP_QA_BROWSER', '/qa/chrome')
  vi.stubEnv('SERVIMAP_QA_DIAGNOSTICOS', '/qa/coverage')
  vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => [pagina] })))
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals() })
const abrir = () => abrirChromeCdp('/qa/runner', { timeoutMs: 0 })
const registros = () => mocks.write.mock.calls.map(([, json]) => JSON.parse(json))

it('abre CDP con perfil nuevo, puerto dinámico y pestaña real sin reintentar', async () => {
  const resultado = await abrir()
  expect(resultado).toEqual({ proceso: procesos[0], puerto: 43210, pagina })
  expect(mocks.spawn).toHaveBeenCalledOnce()
  expect(mocks.spawn.mock.calls[0][1]).toEqual(expect.arrayContaining(['--remote-debugging-port=0', `--user-data-dir=${path.join('/qa/runner', 'perfil-1')}`]))
  expect(mocks.spawn.mock.calls[0][1]).not.toContain('--no-sandbox')
  expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:43210/json/list', expect.objectContaining({ signal: expect.any(AbortSignal) }))
  expect(mocks.write).not.toHaveBeenCalled()
})
it('un mensaje DBus no sustituye ni invalida un handshake correcto', async () => {
  mocks.read.mockImplementation(() => { procesos[0].stderr.emit('data', 'Failed to connect to the bus: Could not parse server address'); return completo })
  await expect(abrir()).resolves.toMatchObject({ puerto: 43210 })
  expect(consola).not.toHaveBeenCalled()
})
it('no intenta arrancar si no hay un navegador instalado', async () => {
  mocks.exists.mockReturnValue(false)
  await expect(abrir()).rejects.toThrow('No hay Chrome/Edge instalado')
  expect(mocks.spawn).not.toHaveBeenCalled()
})
it('en Linux cierra el grupo aislado del Chrome propio antes de reintentar', async () => {
  const real = procesoNode
  vi.stubGlobal('process', new Proxy(real, { get: (target, key) => key === 'platform' ? 'linux' : Reflect.get(target, key) }))
  mocks.read.mockImplementation(() => procesos.length === 1 ? '' : completo)
  await expect(abrir()).resolves.toMatchObject({ puerto: 43210 })
  expect(procesoNode.kill).toHaveBeenCalledWith(-12340, 'SIGTERM')
  expect(mocks.spawn.mock.calls.every(([, , options]) => options.detached === true)).toBe(true)
})
it('cierra el primer proceso antes de reintentar solo el timeout con otro perfil', async () => {
  const spawn = mocks.spawn.getMockImplementation()
  mocks.spawn.mockImplementation((...args) => {
    if (procesos.length) expect(procesos[0].signalCode).not.toBeNull()
    return spawn(...args)
  })
  mocks.read.mockImplementation(() => {
    if (procesos.length === 1) { procesos[0].stderr.emit('data', 'DBus: advertencia\n'); throw Object.assign(new Error('Archivo ausente'), { code: 'ENOENT' }) }
    return completo
  })
  await expect(abrir()).resolves.toMatchObject({ proceso: expect.objectContaining({ pid: 12341 }) })
  expect(mocks.spawn).toHaveBeenCalledTimes(2)
  expect(mocks.spawn.mock.calls[1][1]).toContain(`--user-data-dir=${path.join('/qa/runner', 'perfil-2')}`)
  expect(registros()[0]).toMatchObject({ intento: 1, codigo: 'QA_CDP_PUERTO_TIMEOUT', causa: 'ENOENT', stderr: 'DBus: advertencia\n' })
  expect(JSON.parse(consola.mock.calls[0][0]).reintentar).toBe(true)
})
it('falla después de dos timeouts, conserva ambos errores y no saltea QA', async () => {
  mocks.read.mockReturnValue('')
  await expect(abrir()).rejects.toMatchObject({ name: 'AggregateError', errors: expect.any(Array) })
  expect(mocks.spawn).toHaveBeenCalledTimes(2)
  expect(registros().map((r) => r.intento)).toEqual([1, 2])
  expect(procesos.every((p) => p.kill.mock.calls.length === 1)).toBe(true)
})
it('no reintenta permisos del archivo de CDP', async () => {
  const error = Object.assign(new Error('Permiso denegado'), { code: 'EACCES' }); mocks.read.mockImplementation(() => { throw error })
  await expect(abrir()).rejects.toBe(error)
  expect(mocks.spawn).toHaveBeenCalledOnce()
})
it('no confunde ENOENT del ejecutable con ENOENT transitorio del archivo', async () => {
  mocks.read.mockImplementation(() => { procesos[0].exitCode = -2; procesos[0].emit('error', Object.assign(new Error('Ejecutable ausente'), { code: 'ENOENT' })); return '' })
  await expect(abrir()).rejects.toMatchObject({ message: 'No se pudo ejecutar Chrome.', cause: { code: 'ENOENT' } })
  expect(mocks.spawn).toHaveBeenCalledOnce()
})
it('no reintenta una salida fatal ni oculta el stderr', async () => {
  mocks.read.mockImplementation(() => { procesos[0].stderr.emit('data', 'FATAL: sandbox'); procesos[0].exitCode = 1; return '' })
  await expect(abrir()).rejects.toThrow('Chrome terminó antes de exponer CDP')
  expect(mocks.spawn).toHaveBeenCalledOnce()
  expect(registros()[0]).toMatchObject({ exitCode: 1, stderr: 'FATAL: sandbox' })
})
it('un fallo posterior al puerto no ejecuta otra vez las verificaciones del navegador', async () => {
  vi.mocked(fetch).mockResolvedValue({ json: async () => [] })
  await expect(abrir()).rejects.toThrow('Chrome no expuso una pestaña CDP inicial')
  expect(mocks.spawn).toHaveBeenCalledOnce()
})
it('fuerza cierre si SIGTERM no basta antes de crear otro proceso', async () => {
  const spawn = mocks.spawn.getMockImplementation()
  mocks.spawn.mockImplementation((...args) => {
    const child = spawn(...args)
    if (procesos.length === 1) child.kill.mockImplementation((signal) => { if (signal === 'SIGKILL') terminar(child, signal); return true })
    return child
  })
  mocks.read.mockImplementation(() => procesos.length === 1 ? '' : completo)
  await expect(abrir()).resolves.toMatchObject({ puerto: 43210 })
  expect(procesos[0].kill.mock.calls.map(([s]) => s)).toEqual(['SIGTERM', 'SIGKILL'])
})
it('no lanza otro Chrome si no puede confirmar el cierre del anterior', async () => {
  const spawn = mocks.spawn.getMockImplementation()
  mocks.spawn.mockImplementation((...args) => { const child = spawn(...args); child.kill.mockReturnValue(false); return child })
  mocks.read.mockReturnValue('')
  await expect(abrir()).rejects.toThrow('Chrome falló y no pudo cerrarse correctamente')
  expect(mocks.spawn).toHaveBeenCalledOnce()
  expect(registros()[0].cierre).toContain('Chrome no terminó')
})
