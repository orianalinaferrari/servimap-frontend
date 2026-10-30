import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { crearSolicitud } from '../services/solicitudesService'
import { guardarToken } from '../services/sesionToken'
import { BASE, jwtPrueba, respuesta, instalarHttp } from './helpers/contratos'
beforeEach(() => { vi.stubEnv('VITE_API_URL', BASE) })
afterEach(() => vi.unstubAllEnvs())
describe('Contrato real de solicitudes', () => {
  it('envía IDs y Bearer a POST /api/solicitudes sin cookies', async () => {
    const token = jwtPrueba(); guardarToken(token)
    const datos = { prestadorId: 'perfil-1', oficioId: 'oficio-1', descripcion: 'Reparación', direccion: '', contactoPreferido: 'WhatsApp' }
    const http = instalarHttp(() => respuesta({ id: 'solicitud-1', estado: 'PENDIENTE' }, 201))
    await expect(crearSolicitud(datos)).resolves.toMatchObject({ estado: 'PENDIENTE' })
    const [url, config] = http.mock.calls[0]
    expect(url).toBe(BASE + '/api/solicitudes')
    expect(config.credentials).toBe('omit')
    expect(config.headers.Authorization).toBe(`Bearer ${token}`)
    expect(JSON.parse(config.body)).toEqual(datos)
  })
  it.each([400, 401, 403, 404, 409, 500])('conserva el error real HTTP %s', async (status) => {
    instalarHttp(() => respuesta({ error: `Error de contrato ${status}` }, status))
    await expect(crearSolicitud({})).rejects.toMatchObject({ status, message: `Error de contrato ${status}` })
  })
  it('no envía solicitudes con URL sin configurar', async () => {
    vi.stubEnv('VITE_API_URL', '')
    await expect(crearSolicitud({})).rejects.toThrow('no está configurada')
    expect(fetch).not.toHaveBeenCalled()
  })
  it('informa errores de red', async () => {
    instalarHttp(() => { throw new Error('Red') })
    await expect(crearSolicitud({})).rejects.toThrow('No se pudo conectar')
  })
})
