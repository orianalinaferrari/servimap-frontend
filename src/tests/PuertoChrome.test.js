import { describe, expect, it } from 'vitest'
import { esperarPaginaCdp, esperarPuertoChrome } from '../../scripts/qa/protocolo-cdp.mjs'

const completo = '43210\n/devtools/browser/qa-local\n'
describe('Handshake CDP sin carrera entre existencia y lectura', () => {
  it('acepta inmediatamente un archivo completo', async () => {
    await expect(esperarPuertoChrome(() => completo)).resolves.toBe(43210)
  })
  it.each(['ENOENT', 'EBUSY'])('reintenta un fallo transitorio %s', async code => {
    let intentos = 0
    await expect(esperarPuertoChrome(() => {
      if (intentos++ === 0) throw Object.assign(new Error('Transitorio'), { code })
      return completo
    }, { intervaloMs: 0 })).resolves.toBe(43210)
    expect(intentos).toBe(2)
  })
  it('no confía en un puerto parcial, inválido o sin endpoint de navegador', async () => {
    const partes = ['', '432', '0\n/devtools/browser/x', '70000\n/devtools/browser/x', completo]
    await expect(esperarPuertoChrome(() => partes.shift(), { intervaloMs: 0 })).resolves.toBe(43210)
    expect(partes).toHaveLength(0)
  })
  it('propaga errores ajenos al arranque sin ocultarlos', async () => {
    const error = Object.assign(new Error('Permiso denegado'), { code: 'EACCES' })
    await expect(esperarPuertoChrome(() => { throw error })).rejects.toBe(error)
  })
  it('termina con diagnóstico y causa si el bloqueo no se resuelve', async () => {
    const error = Object.assign(new Error('Bloqueado'), { code: 'EBUSY' })
    await expect(esperarPuertoChrome(() => { throw error }, { timeoutMs: 0, intervaloMs: 0 })).rejects.toMatchObject({ message: 'Chrome no expuso un puerto CDP utilizable.', cause: error })
  })
  it('incluye el stderr de Chrome en el fallo por tiempo agotado', async () => {
    await expect(esperarPuertoChrome(() => '', { timeoutMs: 0, intervaloMs: 0, diagnostico: () => ' Missing X server \n' }))
      .rejects.toThrow('Chrome no expuso un puerto CDP utilizable. Stderr de Chrome: Missing X server')
  })
})

describe('Pestaña CDP inicial', () => {
  const pagina = { type: 'page', url: 'about:blank', webSocketDebuggerUrl: 'ws://127.0.0.1:1/devtools/page/qa' }
  it('reintenta hasta que /json/list registra la pestaña y tolera respuestas transitorias', async () => {
    const respuestas = [() => { throw new Error('ECONNRESET') }, () => [], () => [{ ...pagina, webSocketDebuggerUrl: undefined }], () => [{ type: 'service_worker', url: 'about:blank' }, pagina]]
    await expect(esperarPaginaCdp(async () => respuestas.shift()(), { intervaloMs: 0 })).resolves.toBe(pagina)
    expect(respuestas).toHaveLength(0)
  })
  it('falla con causa si la pestaña nunca aparece', async () => {
    const error = new Error('ECONNREFUSED')
    await expect(esperarPaginaCdp(async () => { throw error }, { timeoutMs: 0, intervaloMs: 0 })).rejects.toMatchObject({ message: 'Chrome no expuso una pestaña CDP inicial.', cause: error })
  })
})
