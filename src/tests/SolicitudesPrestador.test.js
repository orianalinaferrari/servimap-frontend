import { describe, expect, test } from 'vitest'
import {
  puedeResponderSolicitud,
  obtenerAccionesSolicitudPrestador,
  obtenerEstadoDespuesDeResponder,
} from '../utils/solicitudesPrestador'

describe('F-13 - Reglas de solicitudes del prestador', () => {
  test('permite responder solicitudes pendientes', () => {
    expect(
      puedeResponderSolicitud({ id: 1, estado: 'PENDIENTE' })
    ).toBe(true)
  })

  test('no permite responder solicitudes aceptadas', () => {
    expect(
      puedeResponderSolicitud({ id: 1, estado: 'ACEPTADA' })
    ).toBe(false)
  })

  test('no permite responder solicitudes rechazadas', () => {
    expect(
      puedeResponderSolicitud({ id: 1, estado: 'RECHAZADA' })
    ).toBe(false)
  })

  test('no permite responder solicitudes canceladas', () => {
    expect(
      puedeResponderSolicitud({ id: 1, estado: 'CANCELADA' })
    ).toBe(false)
  })

  test('requiere un identificador válido', () => {
    expect(
      puedeResponderSolicitud({ estado: 'PENDIENTE' })
    ).toBe(false)
  })

  test('permite visualizar detalle con identificador', () => {
    expect(
      obtenerAccionesSolicitudPrestador({
        id: 2,
        estado: 'ACEPTADA',
      })
    ).toEqual({
      verDetalle: true,
      aceptar: false,
      rechazar: false,
    })
  })

  test('habilita aceptar y rechazar en pendientes', () => {
    expect(
      obtenerAccionesSolicitudPrestador({
        id: 3,
        estado: 'PENDIENTE',
      })
    ).toEqual({
      verDetalle: true,
      aceptar: true,
      rechazar: true,
    })
  })

  test('obtiene el estado resultante de aceptar', () => {
    expect(obtenerEstadoDespuesDeResponder('aceptar')).toBe('ACEPTADA')
  })

  test('obtiene el estado resultante de rechazar', () => {
    expect(obtenerEstadoDespuesDeResponder('rechazar')).toBe('RECHAZADA')
  })

  test('rechaza acciones desconocidas', () => {
    expect(() => obtenerEstadoDespuesDeResponder('cancelar')).toThrow(
      'La acción sobre la solicitud no es válida.'
    )
  })
})
