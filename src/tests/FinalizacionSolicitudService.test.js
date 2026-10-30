import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as cliente from '../services/solicitudesClienteService'
import { marcarTrabajoTerminadoPrestador } from '../services/solicitudesPrestadorService'
import { BASE, instalarHttp, respuesta } from './helpers/contratos'
beforeEach(() => vi.stubEnv('VITE_API_URL', BASE))
afterEach(() => vi.unstubAllEnvs())
describe('Finalización real en una etapa', () => {
  it('el prestador finaliza mediante PATCH', async () => {
    const http = instalarHttp(() => respuesta({ id: 's1', estado: 'FINALIZADA' }))
    await expect(marcarTrabajoTerminadoPrestador('s1')).resolves.toMatchObject({ estado: 'FINALIZADA' })
    expect(http.mock.calls[0][0]).toBe(BASE + '/api/solicitudes/s1/finalizar')
    expect(http.mock.calls[0][1].method).toBe('PATCH')
  })
  it('no inventa un endpoint de confirmación del cliente', () => {
    expect(cliente.confirmarFinalizacionCliente).toBeUndefined()
  })
  it('rechaza un id vacío sin enviar HTTP', async () => {
    await expect(marcarTrabajoTerminadoPrestador('')).rejects.toThrow('identificador')
    expect(fetch).not.toHaveBeenCalled()
  })
  it.each([401,403,404,409])('propaga rechazo %s del servidor', async (status) => {
    instalarHttp(() => respuesta({ error: 'No se puede finalizar' }, status))
    await expect(marcarTrabajoTerminadoPrestador('s1')).rejects.toMatchObject({ status })
  })
})
