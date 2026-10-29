import { describe, expect, test } from 'vitest'
import {
  ESTADOS_SOLICITUD,
  normalizarEstadoSolicitud,
  obtenerEtiquetaEstado,
  tieneIdentificadorSolicitud,
  puedeCancelarSolicitud,
  puedeResponderSolicitud,
  obtenerAccionesSolicitudCliente,
  obtenerAccionesSolicitudPrestador,
  obtenerEstadoDespuesDeResponder,
  ordenarSolicitudesPorFecha,
} from '../utils/estadosSolicitud'

describe('F-14 - Estados de solicitud', () => {
  test('define los cinco estados requeridos', () => {
    expect(Object.values(ESTADOS_SOLICITUD)).toEqual([
      'PENDIENTE',
      'ACEPTADA',
      'RECHAZADA',
      'CANCELADA',
      'FINALIZADA',
    ])
  })

  test('normaliza estados sin importar mayúsculas o espacios', () => {
    expect(normalizarEstadoSolicitud(' finalizada ')).toBe('FINALIZADA')
    expect(normalizarEstadoSolicitud('pendiente')).toBe('PENDIENTE')
  })

  test('rechaza estados desconocidos', () => {
    expect(normalizarEstadoSolicitud('EN_PROCESO')).toBeNull()
    expect(normalizarEstadoSolicitud(null)).toBeNull()
  })

  test('muestra la etiqueta Finalizada', () => {
    expect(obtenerEtiquetaEstado('FINALIZADA')).toBe('Finalizada')
  })

  test('conserva las etiquetas de los estados anteriores', () => {
    expect(obtenerEtiquetaEstado('PENDIENTE')).toBe('Pendiente')
    expect(obtenerEtiquetaEstado('ACEPTADA')).toBe('Aceptada')
    expect(obtenerEtiquetaEstado('RECHAZADA')).toBe('Rechazada')
    expect(obtenerEtiquetaEstado('CANCELADA')).toBe('Cancelada')
  })

  test('valida identificadores de solicitud', () => {
    expect(tieneIdentificadorSolicitud({ id: 0 })).toBe(true)
    expect(tieneIdentificadorSolicitud({ id: 'ABC' })).toBe(true)
    expect(tieneIdentificadorSolicitud({ id: '' })).toBe(false)
    expect(tieneIdentificadorSolicitud({ id: null })).toBe(false)
    expect(tieneIdentificadorSolicitud({})).toBe(false)
  })

  test('permite cancelar solicitudes pendientes', () => {
    expect(
      puedeCancelarSolicitud({ id: 1, estado: 'PENDIENTE' })
    ).toBe(true)
  })

  test('impide cancelar solicitudes finalizadas', () => {
    expect(
      puedeCancelarSolicitud({ id: 1, estado: 'FINALIZADA' })
    ).toBe(false)
  })

  test('impide responder solicitudes finalizadas', () => {
    expect(
      puedeResponderSolicitud({ id: 1, estado: 'FINALIZADA' })
    ).toBe(false)
  })

  test('mantiene la regla de cancelación de F-12', () => {
    expect(puedeCancelarSolicitud({ estado: 'PENDIENTE' })).toBe(true)
    expect(puedeCancelarSolicitud({ estado: 'ACEPTADA' })).toBe(true)
  })

  test('impide habilitar acciones sin identificador', () => {
    expect(
      obtenerAccionesSolicitudCliente({ estado: 'PENDIENTE' })
    ).toEqual({
      verDetalle: false,
      cancelar: false,
    })

    expect(puedeResponderSolicitud({ estado: 'PENDIENTE' })).toBe(false)
  })

  test('solo permite consultar una solicitud finalizada al cliente', () => {
    expect(
      obtenerAccionesSolicitudCliente({
        id: 1,
        estado: 'FINALIZADA',
      })
    ).toEqual({
      verDetalle: true,
      cancelar: false,
    })
  })

  test('solo permite consultar una solicitud finalizada al prestador', () => {
    expect(
      obtenerAccionesSolicitudPrestador({
        id: 1,
        estado: 'FINALIZADA',
      })
    ).toEqual({
      verDetalle: true,
      aceptar: false,
      rechazar: false,
    })
  })

  test('mantiene las acciones de solicitudes pendientes', () => {
    expect(
      obtenerAccionesSolicitudCliente({
        id: 1,
        estado: 'PENDIENTE',
      })
    ).toEqual({
      verDetalle: true,
      cancelar: true,
    })

    expect(
      obtenerAccionesSolicitudPrestador({
        id: 1,
        estado: 'PENDIENTE',
      })
    ).toEqual({
      verDetalle: true,
      aceptar: true,
      rechazar: true,
    })
  })

  test('mantiene las transiciones de aceptar y rechazar', () => {
    expect(obtenerEstadoDespuesDeResponder('aceptar')).toBe('ACEPTADA')
    expect(obtenerEstadoDespuesDeResponder('rechazar')).toBe('RECHAZADA')
  })

  test('rechaza acciones de respuesta no reconocidas', () => {
    expect(() => obtenerEstadoDespuesDeResponder('finalizar')).toThrow(
      'La acción sobre la solicitud no es válida.'
    )
  })

  test('ordena solicitudes sin modificar el arreglo original', () => {
    const solicitudes = [
      { id: 1, fechaCreacion: '2026-01-01' },
      { id: 2, fechaCreacion: '2026-02-01' },
    ]

    expect(ordenarSolicitudesPorFecha(solicitudes)[0].id).toBe(2)
    expect(solicitudes[0].id).toBe(1)
  })
})
