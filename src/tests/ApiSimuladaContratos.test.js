import { beforeEach, describe, expect, it } from 'vitest'
import { Buffer } from 'node:buffer'
import { crearApiSimulada, CUENTAS_QA, idQA } from '../../scripts/qa/api-simulada.mjs'

// Contratos de error de la API simulada que usan las demos y el QA: deben replicar al backend documentado.
const URL_BASE = 'http://127.0.0.1:4999'
const FIRMA = 'firma-fixture-no-valida-en-produccion'
let api, tokens
const pedir = (method, ruta, { rol, body, headers } = {}) => api.responder({ method, url: URL_BASE + ruta, body, headers: headers ?? (rol ? { authorization: `Bearer ${tokens[rol]}` } : {}) })
const tokenCon = (payload) => `e30.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${FIRMA}`

beforeEach(() => {
  const noDisponible = { id: idQA(150), nombre: 'QA Ocupado', oficioIds: [idQA(201)], disponible: false, latitud: null, longitud: null, zonaCobertura: 'Norte' }
  api = crearApiSimulada({ perfilesAdicionales: [noDisponible] })
  tokens = Object.fromEntries(Object.keys(CUENTAS_QA).map((rol) => [rol, pedir('POST', '/api/auth/login', { body: CUENTAS_QA[rol] }).body.token]))
})

describe('Autenticación simulada', () => {
  it.each([
    ['sin esquema Bearer', { authorization: tokenCon({}) }],
    ['firma ajena a la fixture', { authorization: 'Bearer a.b.c' }],
    ['payload ilegible', { authorization: `Bearer e30.no-json.${FIRMA}` }],
    ['token vencido', { authorization: `Bearer ${tokenCon({ sub: idQA(1), rol: 'CLIENTE', exp: 1 })}` }],
    ['rol que no coincide con el usuario', { authorization: `Bearer ${tokenCon({ sub: idQA(1), rol: 'ADMINISTRADOR', exp: Date.now() / 1000 + 60 })}` }],
  ])('rechaza %s con 401', (_caso, headers) => {
    expect(pedir('GET', '/api/auth/me', { headers }).status).toBe(401)
  })
  it.each([
    ['sin cuerpo', undefined],
    ['DNI con letras', { nombre: 'Ana Pérez', dni: '12A45678', email: 'ana@example.test', password: '12345678', rol: 'CLIENTE' }],
    ['email sin dominio', { nombre: 'Ana Pérez', dni: '12.345.678', email: 'ana@example', password: '12345678', rol: 'CLIENTE' }],
    ['rol administrativo', { nombre: 'Ana Pérez', dni: '12345678', email: 'ana@example.test', password: '12345678', rol: 'ADMINISTRADOR' }],
  ])('el registro rechaza %s con 400', (_caso, body) => {
    expect(pedir('POST', '/api/auth/register', { body }).status).toBe(400)
  })
})

describe('Directorio y perfil profesional', () => {
  it('filtra por oficio y texto, y publica la ficha de cualquier prestador', () => {
    expect(pedir('GET', `/api/prestadores?oficioId=${idQA(202)}`).body).toEqual([])
    expect(pedir('GET', '/api/prestadores?q=norte').body.map((p) => p.id)).toEqual([idQA(150)])
    expect(pedir('GET', `/api/prestadores/${idQA(150)}`).body).toMatchObject({ id: idQA(150), comentarios: [] })
  })
  it.each([
    [{ descripcionProfesional: '  ' }, 'Campo descripcionProfesional vacío'],
    [{ telefono: 'abc' }, 'Contacto inválido'],
    [{ emailContacto: 'sin-arroba' }, 'Email inválido'],
    [{ latitud: 91 }, 'Coordenadas inválidas'],
    [{ longitud: -181 }, 'Coordenadas inválidas'],
  ])('PUT /prestadores/me rechaza %o', (body, error) => {
    expect(pedir('PUT', '/api/prestadores/me', { rol: 'PRESTADOR', body })).toEqual({ status: 400, body: { error } })
  })
})

describe('Solicitudes simuladas', () => {
  const crear = (body) => pedir('POST', '/api/solicitudes', { rol: 'CLIENTE', body })
  it('limita el historial a clientes y prestadores', () => {
    expect(pedir('GET', '/api/solicitudes', { rol: 'ADMINISTRADOR' }).status).toBe(403)
  })
  it.each([
    ['prestador inexistente', { prestadorId: idQA(999), oficioId: idQA(201), descripcion: 'Arreglo' }, 404],
    ['prestador no disponible', { prestadorId: idQA(150), oficioId: idQA(201), descripcion: 'Arreglo' }, 409],
    ['oficio no ofrecido', { prestadorId: idQA(101), oficioId: idQA(202), descripcion: 'Arreglo' }, 400],
    ['descripción vacía', { prestadorId: idQA(101), oficioId: idQA(201), descripcion: ' ' }, 400],
  ])('rechaza crear con %s', (_caso, body, status) => {
    expect(crear(body).status).toBe(status)
  })
  it('aplica titularidad y estados compatibles en las transiciones', () => {
    const { id } = crear({ prestadorId: idQA(101), oficioId: idQA(201), descripcion: 'Pérdida en la cocina' }).body
    expect(pedir('PATCH', `/api/solicitudes/${idQA(998)}/aceptar`, { rol: 'PRESTADOR' }).status).toBe(404)
    expect(pedir('PATCH', `/api/solicitudes/${id}/aceptar`, { rol: 'CLIENTE' }).status).toBe(403)
    expect(pedir('PATCH', `/api/solicitudes/${id}/cancelar`, { rol: 'PRESTADOR' }).status).toBe(403)
    expect(pedir('PATCH', `/api/solicitudes/${id}/finalizar`, { rol: 'PRESTADOR' }).status).toBe(409)
    expect(pedir('PATCH', `/api/solicitudes/${id}/rechazar`, { rol: 'PRESTADOR' }).body.estado).toBe('RECHAZADA')
    expect(pedir('PATCH', `/api/solicitudes/${id}/cancelar`, { rol: 'CLIENTE' }).status).toBe(409)
  })
  it('valida existencia, titularidad y puntaje de las calificaciones', () => {
    const { id } = crear({ prestadorId: idQA(101), oficioId: idQA(201), descripcion: 'Cambio de canilla' }).body
    const calificar = (body) => pedir('POST', '/api/calificaciones', { rol: 'CLIENTE', body })
    expect(calificar({ solicitudId: id, puntaje: 5 }).status).toBe(409)
    for (const accion of ['aceptar', 'finalizar']) pedir('PATCH', `/api/solicitudes/${id}/${accion}`, { rol: 'PRESTADOR' })
    expect(calificar({ solicitudId: idQA(997), puntaje: 5 }).status).toBe(404)
    expect(calificar({ solicitudId: id, puntaje: 0 }).status).toBe(400)
    expect(calificar({ solicitudId: id, puntaje: 5, comentario: 'x'.repeat(501) }).status).toBe(400)
    api.solicitudes.find((s) => s.id === id).clienteId = idQA(77)
    expect(calificar({ solicitudId: id, puntaje: 5 }).status).toBe(403)
  })
})

describe('Administración simulada', () => {
  it('modera una sola vez y exige un motivo válido', () => {
    api.calificaciones.push({ id: idQA(301), prestadorId: idQA(101), clienteId: idQA(1), puntaje: 2, comentario: 'QA', moderada: false })
    const moderar = (id, body) => pedir('PATCH', `/api/calificaciones/${id}/moderacion`, { rol: 'ADMINISTRADOR', body })
    expect(moderar(idQA(996), { motivo: 'Spam' }).status).toBe(404)
    expect(moderar(idQA(301), { motivo: ' ' }).status).toBe(400)
    expect(moderar(idQA(301), { motivo: 'x'.repeat(201) }).status).toBe(400)
    expect(moderar(idQA(301), { motivo: 'Lenguaje inapropiado' }).body.moderada).toBe(true)
    expect(moderar(idQA(301), { motivo: 'Otra vez' }).status).toBe(409)
  })
  it('valida altas, ediciones y cambios de estado de oficios', () => {
    const admin = (method, ruta, body) => pedir(method, ruta, { rol: 'ADMINISTRADOR', body })
    expect(admin('POST', '/api/oficios', { nombre: ' ' }).status).toBe(400)
    expect(admin('POST', '/api/oficios', { nombre: 'Plomería' }).status).toBe(409)
    expect(admin('PUT', `/api/oficios/${idQA(995)}`, { nombre: 'Gasista' }).status).toBe(404)
    expect(admin('PATCH', `/api/oficios/${idQA(201)}/estado`, { activo: 'no' }).status).toBe(400)
    expect(admin('PATCH', `/api/oficios/${idQA(201)}/estado`, { activo: false }).body.activo).toBe(false)
    expect(admin('GET', '/api/ruta-inexistente')).toEqual({ status: 404, body: { error: 'Ruta no simulada' } })
  })
})
