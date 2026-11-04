import { describe, expect, it } from 'vitest'
import { consultasNoDisponibles, servicioConsultasDisponible } from '../services/consultasService'
import { consultaPermitida, errorConsulta, paginaConsultasValida, puedeUsarConsultas, validarNuevaConsulta, validarRespuesta } from '../utils/consultasAyuda'
import { adminConsulta, clienteConsulta, consultaFixture, prestadorConsulta, servicioConsultasFixture } from './helpers/consultasFixtures'

describe('Contrato propuesto de consultas, sin endpoints HTTP', () => {
  it('no habilita el servicio por defecto ni adaptadores incompletos', () => {
    expect(servicioConsultasDisponible(consultasNoDisponibles)).toBe(false)
    expect(servicioConsultasDisponible(null)).toBe(false)
    expect(servicioConsultasDisponible({ disponible: true })).toBe(false)
    expect(servicioConsultasDisponible(servicioConsultasFixture(clienteConsulta))).toBe(true)
    expect(fetch).not.toHaveBeenCalled()
  })
  it.each([clienteConsulta, prestadorConsulta])('permite consultas propias al rol $rol', usuario => {
    expect(puedeUsarConsultas(usuario, false)).toBe(true)
    expect(puedeUsarConsultas(usuario, true)).toBe(false)
  })
  it('limita la bandeja administrativa al administrador con sesión', () => {
    expect(puedeUsarConsultas(adminConsulta, true)).toBe(true)
    expect(puedeUsarConsultas(adminConsulta, false)).toBe(false)
    expect(puedeUsarConsultas(null, false)).toBe(false)
    expect(puedeUsarConsultas({ rol: 'ADMINISTRADOR' }, true)).toBe(false)
    expect(puedeUsarConsultas({ id: 'qa', rol: 'DESCONOCIDO' }, false)).toBe(false)
  })
  it.each([
    [{ categoria: '', asunto: ' ', mensaje: '' }, ['categoria', 'asunto', 'mensaje']],
    [{ categoria: 'constructor', asunto: 'x'.repeat(101), mensaje: 'x'.repeat(2001) }, ['categoria', 'asunto', 'mensaje']],
    [{ categoria: 'PAGOS', asunto: ' x ', mensaje: ' y ' }, []],
    [{ categoria: 'OTRAS', asunto: 'x'.repeat(100), mensaje: 'x'.repeat(2000) }, []],
  ])('valida contenido y límites propuestos', (datos, claves) => {
    expect(Object.keys(validarNuevaConsulta(datos))).toEqual(claves)
  })
  it.each([null, undefined, '', ' ', 4, 'x'.repeat(2001)])('rechaza respuesta inválida %j', valor => {
    expect(validarRespuesta(valor)).toBe(false)
  })
  it('acepta los límites de respuesta sin interpretar HTML', () => {
    expect(validarRespuesta('x'.repeat(2000))).toBe(true)
    expect(validarRespuesta('<script>texto, no código ejecutable</script>')).toBe(true)
  })
  it('exige titularidad, datos y estado confirmados', () => {
    expect(consultaPermitida(consultaFixture(), clienteConsulta, false)).toBeTruthy()
    expect(consultaPermitida(consultaFixture(), prestadorConsulta, false)).toBeFalsy()
    expect(consultaPermitida(consultaFixture(), adminConsulta, true)).toBeTruthy()
  })
  it.each([
    null, { id: '' }, { autorId: '' }, { categoria: 'INVENTADA' }, { estado: 'INVENTADO' },
    { fechaCreacion: 'ayer' }, { estado: 'RESPONDIDA' }, { respuesta: {} },
    { estado: 'RESPONDIDA', respuesta: { mensaje: '', fechaCreacion: '2026-11-03' } },
    { estado: 'CERRADA', respuesta: { mensaje: 'Respuesta', fechaCreacion: 'ayer' } },
  ])('rechaza un detalle incompleto o incoherente %j', cambio => {
    expect(consultaPermitida(cambio === null ? null : consultaFixture(cambio), clienteConsulta, false)).toBeFalsy()
  })
  it.each(['RESPONDIDA', 'CERRADA'])('admite respuesta confirmada en estado %s', estado => {
    expect(consultaPermitida(consultaFixture({ estado, respuesta: { mensaje: 'Orientación confirmada.', fechaCreacion: '2026-11-03T16:00:00Z' } }), clienteConsulta, false)).toBeTruthy()
  })
  it('valida totales del servidor sin inventar paginación', () => {
    const resultado = { datos: [consultaFixture()], pagina: 1, total: 21, totalPaginas: 2 }
    expect(paginaConsultasValida(resultado, 1, '', clienteConsulta, false)).toBe(true)
    for (const cambio of [{ pagina: 2 }, { total: -1 }, { total: 0 }, { totalPaginas: 8 }, { datos: null }, { datos: [consultaFixture(), consultaFixture()] }, { datos: Array(21).fill(consultaFixture()) }]) {
      expect(paginaConsultasValida({ ...resultado, ...cambio }, 1, '', clienteConsulta, false)).toBeFalsy()
    }
    expect(paginaConsultasValida(resultado, 1, 'RESPONDIDA', clienteConsulta, false)).toBe(false)
    expect(paginaConsultasValida(resultado, 1, '', prestadorConsulta, false)).toBe(false)
    expect(paginaConsultasValida(null, 1, '', clienteConsulta, false)).toBe(false)
    expect(paginaConsultasValida({ datos: [], pagina: 1, total: 0, totalPaginas: 1 }, 1, '', clienteConsulta, false)).toBe(true)
  })
  it.each([400, 401, 403, 404, 409, 500, undefined])('muestra un error seguro para HTTP %s', status => {
    expect(errorConsulta({ status, message: 'token=SECRETO_FICTICIO_NO_MOSTRAR' })).not.toContain('SECRETO')
    expect(errorConsulta({ status })).toBeTruthy()
  })
})
