import { describe, expect, it } from 'vitest'
import { crearDemoCliente } from '../../scripts/qa/cliente-datos.mjs'
import { CUENTAS_QA, idQA } from '../../scripts/qa/api-simulada.mjs'
const pedir = (api, method, path, body, token) => api.responder({ method, url: `http://127.0.0.1:4195${path}`, body, headers: token ? { Authorization: `Bearer ${token}` } : {} })
const login = (api) => pedir(api, 'POST', '/api/auth/login', CUENTAS_QA.CLIENTE).body.token

describe('Demo QA CLIENTE y contratos compartidos', () => {
  it('presenta tres prestadores, filtros y solo ubicaciones públicas disponibles', () => {
    const api = crearDemoCliente()
    expect(pedir(api, 'GET', '/api/prestadores').body).toHaveLength(3)
    expect(pedir(api, 'GET', '/api/prestadores?q=Lucía').body[0].id).toBe(idQA(102))
    expect(pedir(api, 'GET', '/api/prestadores?oficioId=' + idQA(203)).body).toHaveLength(1)
    expect(pedir(api, 'GET', '/api/prestadores/mapa').body).toHaveLength(1)
    expect(pedir(api, 'GET', '/api/prestadores/mapa').body[0].latitud).toBe(-31.42)
  })
  it('permite solicitar al prestador sin coordenadas y conserva su identidad en el historial', () => {
    const api = crearDemoCliente(), token = login(api)
    expect(pedir(api, 'POST', '/api/solicitudes', { prestadorId: idQA(102), oficioId: idQA(203), descripcion: 'QA: pintar comedor.' }, token).status).toBe(201)
    const lista = pedir(api, 'GET', '/api/solicitudes', undefined, token).body
    expect(lista[0].prestador).toMatchObject({ id: idQA(102), nombre: 'QA Lucía Demo — Pintura' })
    expect(pedir(api, 'GET', '/api/prestadores/me', undefined, token).status).toBe(403)
    expect(pedir(api, 'GET', '/api/oficios/todos', undefined, token).status).toBe(403)
  })
  it('califica una finalizada, evita duplicados y cancela solo estados permitidos', () => {
    const api = crearDemoCliente(), token = login(api)
    expect(pedir(api, 'POST', '/api/calificaciones', { solicitudId: idQA(604), puntaje: 5, comentario: 'QA: excelente.' }, token).status).toBe(201)
    expect(pedir(api, 'POST', '/api/calificaciones', { solicitudId: idQA(604), puntaje: 5 }, token).status).toBe(409)
    expect(pedir(api, 'PATCH', `/api/solicitudes/${idQA(601)}/cancelar`, undefined, token).body.estado).toBe('CANCELADA')
    expect(pedir(api, 'PATCH', `/api/solicitudes/${idQA(604)}/cancelar`, undefined, token).status).toBe(409)
  })
  it('incluye vacío y errores recuperables sin añadir endpoints QA', () => {
    const vacia = crearDemoCliente('vacio')
    expect(vacia.solicitudes).toHaveLength(0)
    expect(pedir(vacia, 'GET', '/api/prestadores/mapa').body).toEqual([])
    const api = crearDemoCliente('errores'), token = login(api)
    const datos = { prestadorId: api.perfil.id, oficioId: idQA(201), descripcion: 'QA: pérdida de agua.' }
    expect(pedir(api, 'POST', '/api/solicitudes', datos, token).status).toBe(409)
    expect(pedir(api, 'POST', '/api/solicitudes', datos, token).status).toBe(201)
  })
})
