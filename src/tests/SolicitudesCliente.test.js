import { describe, expect, test } from 'vitest'
import {
  ESTADOS_SOLICITUD,
  normalizarEstadoSolicitud,
  obtenerEtiquetaEstado,
  puedeCancelarSolicitud,
  obtenerAccionesSolicitud,
  ordenarSolicitudesPorFecha,
} from '../utils/solicitudesCliente'

describe('F-12 - Lógica de solicitudes del cliente', () => {
  test('reconoce los estados definidos provisionalmente', () => {
    expect(normalizarEstadoSolicitud(' pendiente ')).toBe(
      ESTADOS_SOLICITUD.PENDIENTE
    )
    expect(normalizarEstadoSolicitud('ACEPTADA')).toBe(
      ESTADOS_SOLICITUD.ACEPTADA
    )
  })

  test('no interpreta estados desconocidos como válidos', () => {
    expect(normalizarEstadoSolicitud('DESCONOCIDO')).toBeNull()
    expect(normalizarEstadoSolicitud(null)).toBeNull()
  })

  test('muestra etiquetas legibles', () => {
    expect(obtenerEtiquetaEstado('PENDIENTE')).toBe('Pendiente')
    expect(obtenerEtiquetaEstado('CANCELADA')).toBe('Cancelada')
  })

  test('conserva información de estados no reconocidos', () => {
    expect(obtenerEtiquetaEstado('EN_PROCESO')).toBe('Estado: EN_PROCESO')
  })

  test('permite cancelar solicitudes pendientes', () => {
    expect(puedeCancelarSolicitud({ estado: 'PENDIENTE' })).toBe(true)
  })

  test('no permite cancelar solicitudes aceptadas', () => {
    expect(puedeCancelarSolicitud({ estado: 'ACEPTADA' })).toBe(false)
  })

  test('no permite cancelar solicitudes rechazadas o canceladas', () => {
    expect(puedeCancelarSolicitud({ estado: 'RECHAZADA' })).toBe(false)
    expect(puedeCancelarSolicitud({ estado: 'CANCELADA' })).toBe(false)
  })

  test('habilita acciones según el estado', () => {
    expect(obtenerAccionesSolicitud({
      id: 1,
      estado: 'PENDIENTE',
    })).toEqual({
      verDetalle: true,
      cancelar: true,
    })
  })

  test('no habilita acciones sin identificador', () => {
    expect(obtenerAccionesSolicitud({
      estado: 'PENDIENTE',
    })).toEqual({
      verDetalle: false,
      cancelar: false,
    })
  })

  test('ordena las solicitudes desde la más reciente', () => {
    const resultado = ordenarSolicitudesPorFecha([
      { id: 1, fechaCreacion: '2026-01-01' },
      { id: 2, fechaCreacion: '2026-10-01' },
    ])

    expect(resultado.map((solicitud) => solicitud.id)).toEqual([2, 1])
  })

  test('no modifica el listado original', () => {
    const original = [
      { id: 1, fechaCreacion: '2026-01-01' },
      { id: 2, fechaCreacion: '2026-10-01' },
    ]

    ordenarSolicitudesPorFecha(original)

    expect(original[0].id).toBe(1)
  })

  test('maneja listados inválidos', () => {
    expect(ordenarSolicitudesPorFecha(null)).toEqual([])
  })
})
