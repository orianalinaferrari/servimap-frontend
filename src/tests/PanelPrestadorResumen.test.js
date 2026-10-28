import { describe, expect, test } from 'vitest'
import {
  obtenerActividadRecientePrestador,
  resumirSolicitudesPrestador,
} from '../utils/panelPrestador'

describe('F-19 - Indicadores del panel del prestador', () => {
  test('calcula los totales por estado', () => {
    const resultado = resumirSolicitudesPrestador([
      { id: 1, estado: 'PENDIENTE' },
      { id: 2, estado: 'pendiente' },
      { id: 3, estado: 'ACEPTADA' },
      { id: 4, estado: 'FINALIZADA' },
      { id: 5, estado: 'RECHAZADA' },
      { id: 6, estado: 'CANCELADA' },
    ])

    expect(resultado).toEqual({
      total: 6,
      pendientes: 2,
      aceptadas: 1,
      finalizadas: 1,
      rechazadas: 1,
      canceladas: 1,
    })
  })

  test('devuelve ceros cuando no hay solicitudes', () => {
    expect(resumirSolicitudesPrestador([])).toEqual({
      total: 0,
      pendientes: 0,
      aceptadas: 0,
      finalizadas: 0,
      rechazadas: 0,
      canceladas: 0,
    })
  })

  test('tolera respuestas que no sean listas', () => {
    expect(resumirSolicitudesPrestador(null).total).toBe(0)
  })

  test('ordena actividad reciente de la más nueva a la más antigua', () => {
    const resultado = obtenerActividadRecientePrestador([
      { id: 1, fechaCreacion: '2026-10-01' },
      { id: 2, fechaCreacion: '2026-10-25' },
      { id: 3, fechaCreacion: '2026-10-15' },
    ])

    expect(resultado.map((solicitud) => solicitud.id)).toEqual([
      2, 3, 1,
    ])
  })

  test('limita la actividad reciente a cinco elementos', () => {
    const solicitudes = Array.from(
      { length: 8 },
      (_, indice) => ({
        id: indice + 1,
        fechaCreacion: '2026-10-20',
      })
    )

    expect(
      obtenerActividadRecientePrestador(solicitudes)
    ).toHaveLength(5)
  })

  test('no modifica el orden de la lista original', () => {
    const solicitudes = [
      { id: 1, fechaCreacion: '2026-10-01' },
      { id: 2, fechaCreacion: '2026-10-25' },
    ]

    obtenerActividadRecientePrestador(solicitudes)

    expect(solicitudes[0].id).toBe(1)
  })
})
