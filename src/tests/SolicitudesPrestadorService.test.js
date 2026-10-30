import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { obtenerSolicitudesPrestador, aceptarSolicitudPrestador, rechazarSolicitudPrestador } from '../services/solicitudesPrestadorService'
import { BASE, respuesta, instalarHttp } from './helpers/contratos'
beforeEach(() => vi.stubEnv('VITE_API_URL', BASE))
afterEach(() => vi.unstubAllEnvs())
describe('Solicitudes Prestador: contrato real', () => {
  it('consulta GET /api/solicitudes y adapta nombres del oficio', async () => {
    const http = instalarHttp(() => respuesta([{ id: 's1', oficio: { id: 'o1', nombre: 'Plomeria' }, estado: 'PENDIENTE', calificada: false }]))
    await expect(obtenerSolicitudesPrestador()).resolves.toMatchObject([{ id: 's1', servicio: 'Plomeria' }])
    expect(http.mock.calls[0][0]).toBe(BASE + '/api/solicitudes')
  })
  it('rechaza respuestas que no son arrays del contrato', async () => {
    instalarHttp(() => respuesta({ solicitudes: [] }))
    await expect(obtenerSolicitudesPrestador()).rejects.toThrow('formato')
  })
  it('ejecuta aceptar por PATCH al endpoint real', async () => {
    const http=instalarHttp(() => respuesta({ id: 's1' }))
    await aceptarSolicitudPrestador('s1')
    expect(http.mock.calls[0][0]).toBe(BASE + '/api/solicitudes/s1/aceptar')
    expect(http.mock.calls[0][1]).toMatchObject({ method: 'PATCH', credentials: 'omit' })
  })
  it('no ejecuta aceptar sin identificador', async () => {
    await expect(aceptarSolicitudPrestador('')).rejects.toThrow('identificador')
    expect(fetch).not.toHaveBeenCalled()
  })
it('ejecuta rechazar por PATCH al endpoint real', async () => {
    const http=instalarHttp(() => respuesta({ id: 's1' }))
    await rechazarSolicitudPrestador('s1')
    expect(http.mock.calls[0][0]).toBe(BASE + '/api/solicitudes/s1/rechazar')
    expect(http.mock.calls[0][1]).toMatchObject({ method: 'PATCH', credentials: 'omit' })
  })
  it('no ejecuta rechazar sin identificador', async () => {
    await expect(rechazarSolicitudPrestador('')).rejects.toThrow('identificador')
    expect(fetch).not.toHaveBeenCalled()
  })
  it.each([401,403,404,409,500])('propaga HTTP %s sin inventar estados', async(status)=>{
    instalarHttp(()=>respuesta({error:'Estado o permisos rechazados'},status))
    await expect(aceptarSolicitudPrestador('s1')).rejects.toMatchObject({status})
  })
})
