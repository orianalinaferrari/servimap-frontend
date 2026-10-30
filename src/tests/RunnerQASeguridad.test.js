import { describe, expect, it } from 'vitest'
import { crearApiSimulada, politicaDeRed, API_SIMULADA_ORIGIN, CUENTAS_QA, idQA } from '../../scripts/qa/api-simulada.mjs'
import { esIntercepcionCancelada } from '../../scripts/qa/protocolo-cdp.mjs'

const pedir = (api, method, path, body, token) => api.responder({ method, url: API_SIMULADA_ORIGIN + path, body, headers: token ? { Authorization: `Bearer ${token}` } : {} })
const login = (api, rol) => pedir(api, 'POST', '/api/auth/login', CUENTAS_QA[rol]).body.token

describe('Seguridad del runner de QA y fidelidad de su API simulada', () => {
  it.each([
    ['Invalid InterceptionId.', 'cancelada', true],
    ['Invalid InterceptionId.', 'activa', false],
    ['Invalid InterceptionId.', undefined, false],
    ['Fallo de intercepción', 'cancelada', false],
    ['Timeout CDP: Fetch.fulfillRequest', 'cancelada', false],
  ])('solo tolera cancelaciones confirmadas: %s / %s', (mensaje, networkId, tolerado) => {
    expect(esIntercepcionCancelada(new Error(mensaje), networkId, new Set(['cancelada']))).toBe(tolerado)
  })
  it.each(['GET','POST','PUT','PATCH','DELETE','OPTIONS'])('intercepta siempre %s al backend, nunca permite tráfico real', (method) => {
    expect(politicaDeRed({ method, url: API_SIMULADA_ORIGIN + '/api/auth/register' })).toBe('simular')
  })
  it.each(['POST','PUT','PATCH','DELETE','OPTIONS'])('bloquea %s a cualquier otro servidor', (method) => {
    expect(politicaDeRed({ method, url: 'https://otro.example.test/api/usuarios' })).toBe('bloquear')
  })
  it('solo deja pasar lecturas de recursos locales/cartográficos', () => {
    expect(politicaDeRed({ method: 'GET', url: 'https://tiles.openfreemap.org/styles/liberty' })).toBe('lectura')
    expect(politicaDeRed({ method: 'GET', url: 'http://localhost:5173/src/App.jsx' })).toBe('lectura')
  })
  it('reproduce DNI obligatorio y prohibición de registro administrativo', () => {
    const api = crearApiSimulada(), datos = { nombre: 'Fixture', email: 'fixture@example.test', password: 'fixture-local-only', rol: 'CLIENTE' }
    expect(pedir(api, 'POST', '/api/auth/register', datos).status).toBe(400)
    expect(pedir(api, 'POST', '/api/auth/register', { ...datos, dni: '98765432', rol: 'ADMINISTRADOR' }).status).toBe(400)
    expect(pedir(api, 'POST', '/api/auth/register', { ...datos, dni: '98.765.432' }).status).toBe(201)
    expect(pedir(api, 'POST', '/api/auth/register', { ...datos, dni: '98765432' }).status).toBe(409)
  })
  it('exige JWT y rol para operaciones protegidas', () => {
    const api = crearApiSimulada()
    expect(pedir(api, 'GET', '/api/auth/me').status).toBe(401)
    expect(pedir(api, 'GET', '/api/oficios/todos', undefined, login(api, 'CLIENTE')).status).toBe(403)
    expect(pedir(api, 'GET', '/api/oficios/todos', undefined, login(api, 'ADMINISTRADOR')).status).toBe(200)
  })
  it('no acepta finalizar antes de aceptar ni calificar una pendiente', () => {
    const api = crearApiSimulada(), cliente = login(api, 'CLIENTE'), prestador = login(api, 'PRESTADOR')
    const solicitud = pedir(api, 'POST', '/api/solicitudes', { prestadorId: idQA(101), oficioId: idQA(201), descripcion: 'Fixture de contrato' }, cliente).body
    expect(pedir(api, 'PATCH', `/api/solicitudes/${solicitud.id}/finalizar`, undefined, prestador).status).toBe(409)
    expect(pedir(api, 'POST', '/api/calificaciones', { solicitudId: solicitud.id, puntaje: 5 }, cliente).status).toBe(409)
    expect(pedir(api, 'PATCH', `/api/solicitudes/${solicitud.id}/aceptar`, undefined, prestador).status).toBe(200)
    expect(pedir(api, 'PATCH', `/api/solicitudes/${solicitud.id}/finalizar`, undefined, prestador).body.estado).toBe('FINALIZADA')
  })
  it('redondea coordenadas públicas sin filtrar datos privados', () => {
    const api = crearApiSimulada()
    const privado = pedir(api, 'PUT', '/api/prestadores/me', { latitud: -34.601234, longitud: -58.381234 }, login(api, 'PRESTADOR')).body
    const publico = pedir(api, 'GET', '/api/prestadores/mapa').body[0]
    expect(privado.latitud).toBe(-34.601234)
    expect(publico).toMatchObject({ latitud: -34.6, longitud: -58.38 })
    for (const dato of ['dni','email','token','telefono']) expect(publico).not.toHaveProperty(dato)
  })
})
