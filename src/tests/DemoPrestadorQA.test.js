import { describe, expect, it } from 'vitest'
import { crearDemoPrestador } from '../../scripts/qa/prestador-datos.mjs'
import { CUENTAS_QA, idQA } from '../../scripts/qa/api-simulada.mjs'

const pedir = (api, method, path, body, token) => api.responder({ method, url: `http://127.0.0.1:4193${path}`, body, headers: token ? { Authorization: `Bearer ${token}` } : {} })
const login = (api) => pedir(api, 'POST', '/api/auth/login', CUENTAS_QA.PRESTADOR).body.token

describe('Demo aislada del prestador', () => {
  it('incluye estados variados y calificaciones asociadas a trabajos finalizados', () => {
    const api = crearDemoPrestador(), token = login(api)
    const lista = pedir(api, 'GET', '/api/solicitudes', undefined, token).body
    expect(new Set(lista.map((s) => s.estado))).toEqual(new Set(['PENDIENTE', 'ACEPTADA', 'FINALIZADA', 'RECHAZADA', 'CANCELADA']))
    expect(lista.every((s) => s.prestadorId === api.perfil.id && s.oficio.nombre)).toBe(true)
    expect(api.calificaciones.every((c) => lista.some((s) => s.id === c.solicitudId && s.estado === 'FINALIZADA'))).toBe(true)
  })
  it('conserva JWT, permisos y prohibición de acciones de cliente o administrador', () => {
    const api = crearDemoPrestador(), token = login(api)
    expect(pedir(api, 'GET', '/api/prestadores/me').status).toBe(401)
    expect(pedir(api, 'GET', '/api/auth/me', undefined, token).body.rol).toBe('PRESTADOR')
    expect(pedir(api, 'GET', '/api/oficios/todos', undefined, token).status).toBe(403)
    expect(pedir(api, 'POST', '/api/solicitudes', {}, token).status).toBe(403)
    expect(pedir(api, 'POST', '/api/calificaciones', {}, token).status).toBe(403)
  })
  it('guarda perfil y oficios en memoria sin modificar otra instancia', () => {
    const api = crearDemoPrestador(), otra = crearDemoPrestador(), token = login(api)
    expect(pedir(api, 'PUT', '/api/prestadores/me', { precioMin: 15000, disponible: false }, token).body.precioMin).toBe(15000)
    expect(otra.perfil.precioMin).toBe(12000)
    expect(pedir(api, 'PUT', '/api/prestadores/me/oficios', { oficioIds: [idQA(203)] }, token).body.oficios[0].nombre).toBe('Pintura')
    expect(pedir(api, 'PUT', '/api/prestadores/me/oficios', { oficioIds: [idQA(204)] }, token).status).toBe(400)
  })
  it('mantiene las transiciones de solicitudes y rechaza estados incompatibles', () => {
    const api = crearDemoPrestador(), token = login(api), path = `/api/solicitudes/${idQA(601)}`
    expect(pedir(api, 'PATCH', `${path}/finalizar`, undefined, token).status).toBe(409)
    expect(pedir(api, 'PATCH', `${path}/aceptar`, undefined, token).body.estado).toBe('ACEPTADA')
    expect(pedir(api, 'PATCH', `${path}/finalizar`, undefined, token).body.estado).toBe('FINALIZADA')
    expect(pedir(api, 'PATCH', `/api/solicitudes/${idQA(602)}/rechazar`, undefined, token).body.estado).toBe('RECHAZADA')
  })
  it('expone coordenadas públicas aproximadas y ningún oficio inactivo', () => {
    const api = crearDemoPrestador(), mapa = pedir(api, 'GET', '/api/prestadores/mapa').body
    expect(mapa[0]).toMatchObject({ latitud: -31.42, longitud: -64.18 })
    expect(mapa[0]).not.toHaveProperty('telefono')
    expect(pedir(api, 'GET', '/api/oficios').body.some((o) => !o.activo)).toBe(false)
  })
  it.each(['incompleto', 'vacio'])('permite recorrer el escenario %s sin actividad inventada', (escenario) => {
    const api = crearDemoPrestador(escenario)
    expect(api.solicitudes).toHaveLength(0)
    expect(api.calificaciones).toHaveLength(0)
    if (escenario === 'incompleto') {
      expect(api.perfil.oficioIds).toEqual([])
      expect(api.perfil.latitud).toBeNull()
      expect(pedir(api, 'GET', '/api/prestadores/mapa').body).toEqual([])
    }
  })
  it('rechaza un escenario desconocido antes de iniciar servidores', () => {
    expect(() => crearDemoPrestador('otro')).toThrow(/Escenario válido/)
  })
})
