import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { obtenerSolicitudesCliente, cancelarSolicitudCliente } from '../services/solicitudesClienteService'
import { BASE, respuesta, instalarHttp } from './helpers/contratos'
beforeEach(() => vi.stubEnv('VITE_API_URL', BASE))
afterEach(() => vi.unstubAllEnvs())
describe('Solicitudes Cliente: contrato real', () => {
  it('consulta GET /api/solicitudes y adapta nombres del oficio', async () => {
    const http = instalarHttp(() => respuesta([{ id: 's1', oficio: { id: 'o1', nombre: 'Plomeria' }, estado: 'PENDIENTE', calificada: false }]))
    await expect(obtenerSolicitudesCliente()).resolves.toMatchObject([{ id: 's1', servicio: 'Plomeria' }])
    expect(http.mock.calls[0][0]).toBe(BASE + '/api/solicitudes')
  })
  it('rechaza respuestas que no son arrays del contrato', async () => {
    instalarHttp(() => respuesta({ solicitudes: [] }))
    await expect(obtenerSolicitudesCliente()).rejects.toThrow('formato')
  })
  it('ejecuta cancelar por PATCH al endpoint real', async () => {
    const http=instalarHttp(() => respuesta({ id: 's1' }))
    await cancelarSolicitudCliente('s1')
    expect(http.mock.calls[0][0]).toBe(BASE + '/api/solicitudes/s1/cancelar')
    expect(http.mock.calls[0][1]).toMatchObject({ method: 'PATCH', credentials: 'omit' })
  })
  it('no ejecuta cancelar sin identificador', async () => {
    await expect(cancelarSolicitudCliente('')).rejects.toThrow('identificador')
    expect(fetch).not.toHaveBeenCalled()
  })
  it.each([401,403,404,409,500])('propaga HTTP %s sin inventar estados', async(status)=>{
    instalarHttp(()=>respuesta({error:'Estado o permisos rechazados'},status))
    await expect(cancelarSolicitudCliente('s1')).rejects.toMatchObject({status})
  })
})
