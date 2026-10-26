import { describe, expect, test } from 'vitest'
import {
  SOLICITUD_INICIAL,
  validarSolicitud,
  construirSolicitud,
} from '../utils/solicitudes'

const prestador = {
  id: 1,
  oficios: ['Plomero', 'Gasista'],
}

const datosValidos = {
  servicio: 'Plomero',
  descripcion: 'Necesito reparar una pérdida de agua.',
  direccion: 'Av. Santa Fe 1234',
  fechaPreferida: '',
}

describe('F-11 - Validación de solicitudes', () => {
  test('acepta una solicitud válida', () => {
    expect(validarSolicitud(datosValidos, prestador)).toEqual({})
  })

  test('rechaza una solicitud sin prestador', () => {
    expect(validarSolicitud(datosValidos, null).prestador).toBeTruthy()
  })

  test('requiere seleccionar un servicio', () => {
    expect(
      validarSolicitud({ ...datosValidos, servicio: '' }, prestador).servicio
    ).toBeTruthy()
  })

  test('rechaza un servicio que el prestador no ofrece', () => {
    expect(
      validarSolicitud({ ...datosValidos, servicio: 'Electricista' }, prestador)
        .servicio
    ).toBeTruthy()
  })

  test('requiere una descripción suficiente', () => {
    expect(
      validarSolicitud({ ...datosValidos, descripcion: 'Hola' }, prestador)
        .descripcion
    ).toBeTruthy()
  })

  test('requiere una dirección válida', () => {
    expect(
      validarSolicitud({ ...datosValidos, direccion: 'ABC' }, prestador)
        .direccion
    ).toBeTruthy()
  })

  test('rechaza una fecha anterior a hoy', () => {
    const resultado = validarSolicitud(
      { ...datosValidos, fechaPreferida: '2025-01-01' },
      prestador,
      new Date('2026-10-26T12:00:00')
    )

    expect(resultado.fechaPreferida).toBeTruthy()
  })

  test('permite omitir la fecha preferida', () => {
    expect(validarSolicitud(datosValidos, prestador)).toEqual({})
  })

  test('construye el payload sin fecha cuando no se especifica', () => {
    expect(construirSolicitud(datosValidos, prestador)).toEqual({
      prestadorId: 1,
      servicio: 'Plomero',
      descripcion: 'Necesito reparar una pérdida de agua.',
      direccion: 'Av. Santa Fe 1234',
    })
  })

  test('incluye fecha cuando se especifica', () => {
    const resultado = construirSolicitud(
      { ...datosValidos, fechaPreferida: '2026-12-01' },
      prestador
    )

    expect(resultado.fechaPreferida).toBe('2026-12-01')
  })

  test('inicializa todos los campos vacíos', () => {
    expect(SOLICITUD_INICIAL.servicio).toBe('')
    expect(SOLICITUD_INICIAL.descripcion).toBe('')
    expect(SOLICITUD_INICIAL.direccion).toBe('')
  })
})
