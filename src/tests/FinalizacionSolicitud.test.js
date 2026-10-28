import { describe, expect, test } from 'vitest'
import {
  estaPendienteConfirmacionFinalizacion,
  puedeMarcarTrabajoTerminado,
  puedeConfirmarFinalizacion,
} from '../utils/finalizacionSolicitud'

describe('F-16 - Reglas de finalización', () => {
  const aceptada = {
    id: 101,
    estado: 'ACEPTADA',
    finalizacionPendienteConfirmacion: false,
  }

  const pendienteConfirmacion = {
    ...aceptada,
    finalizacionPendienteConfirmacion: true,
  }

  test('el prestador puede marcar como terminado un trabajo aceptado', () => {
    expect(puedeMarcarTrabajoTerminado(aceptada)).toBe(true)
  })

  test('no permite volver a marcar un trabajo pendiente de confirmación', () => {
    expect(
      puedeMarcarTrabajoTerminado(pendienteConfirmacion)
    ).toBe(false)
  })

  test('el cliente solo confirma después del prestador', () => {
    expect(puedeConfirmarFinalizacion(aceptada)).toBe(false)
    expect(puedeConfirmarFinalizacion(pendienteConfirmacion)).toBe(true)
  })

  test.each(['PENDIENTE', 'RECHAZADA', 'CANCELADA', 'FINALIZADA'])(
    'no permite finalizar solicitudes en estado %s',
    (estado) => {
      const solicitud = {
        id: 101,
        estado,
        finalizacionPendienteConfirmacion: true,
      }

      expect(puedeMarcarTrabajoTerminado(solicitud)).toBe(false)
      expect(puedeConfirmarFinalizacion(solicitud)).toBe(false)
    }
  )

  test('no permite acciones sin identificador', () => {
    const solicitud = {
      estado: 'ACEPTADA',
      finalizacionPendienteConfirmacion: true,
    }

    expect(puedeMarcarTrabajoTerminado(solicitud)).toBe(false)
    expect(puedeConfirmarFinalizacion(solicitud)).toBe(false)
  })

  test('no asume que un trabajo está listo si falta el indicador', () => {
    expect(
      puedeMarcarTrabajoTerminado({
        id: 101,
        estado: 'ACEPTADA',
      })
    ).toBe(false)
  })

  test('detecta una finalización pendiente de confirmación', () => {
    expect(
      estaPendienteConfirmacionFinalizacion(pendienteConfirmacion)
    ).toBe(true)
  })
})
