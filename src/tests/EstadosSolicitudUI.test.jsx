import { afterEach, describe, expect, test } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import EstadoSolicitud from '../components/EstadoSolicitud'
import {
  ESTADOS_SOLICITUD,
  obtenerAccionesSolicitudCliente,
  obtenerAccionesSolicitudPrestador,
} from '../utils/estadosSolicitud'

afterEach(() => {
  cleanup()
})

describe('F-14 - Representación visual de estados', () => {
  const casos = [
    ['PENDIENTE', 'Pendiente', 'pendiente'],
    ['ACEPTADA', 'Aceptada', 'aceptada'],
    ['RECHAZADA', 'Rechazada', 'rechazada'],
    ['CANCELADA', 'Cancelada', 'cancelada'],
    ['FINALIZADA', 'Finalizada', 'finalizada'],
  ]

  test.each(casos)(
    'representa %s con etiqueta y clase correctas',
    (estado, etiqueta, clase) => {
      const { container } = render(
        <EstadoSolicitud estado={estado} />
      )

      expect(screen.getByText(etiqueta)).toBeTruthy()

      const elemento = container.querySelector(
        '.estado-solicitud'
      )

      expect(elemento).not.toBeNull()
      expect(elemento.classList.contains(
        `estado-solicitud--${clase}`
      )).toBe(true)

      expect(elemento.getAttribute('data-estado')).toBe(estado)
    }
  )

  test('normaliza estados en minúsculas', () => {
    const { container } = render(
      <EstadoSolicitud estado=" finalizada " />
    )

    expect(screen.getByText('Finalizada')).toBeTruthy()

    expect(
      container.querySelector('.estado-solicitud')
        .getAttribute('data-estado')
    ).toBe('FINALIZADA')
  })

  test('representa un estado desconocido sin asumir otro estado', () => {
    const { container } = render(
      <EstadoSolicitud estado="EN_PROCESO" />
    )

    expect(screen.getByText('Estado: EN_PROCESO')).toBeTruthy()

    expect(
      container.querySelector('.estado-solicitud')
        .classList.contains('estado-solicitud--desconocido')
    ).toBe(true)
  })

  test('representa un estado ausente', () => {
    const { container } = render(
      <EstadoSolicitud estado={null} />
    )

    expect(screen.getByText('Estado desconocido')).toBeTruthy()

    expect(
      container.querySelector('.estado-solicitud')
        .getAttribute('data-estado')
    ).toBe('DESCONOCIDO')
  })
})

describe('F-14 - Acciones permitidas por estado', () => {
  test.each(Object.values(ESTADOS_SOLICITUD))(
    'aplica las reglas de cliente y prestador para %s',
    (estado) => {
      const solicitud = { id: 10, estado }
      const pendiente = estado === ESTADOS_SOLICITUD.PENDIENTE

      expect(
        obtenerAccionesSolicitudCliente(solicitud)
      ).toEqual({
        verDetalle: true,
        cancelar: pendiente,
      })

      expect(
        obtenerAccionesSolicitudPrestador(solicitud)
      ).toEqual({
        verDetalle: true,
        aceptar: pendiente,
        rechazar: pendiente,
      })
    }
  )

  test('no habilita acciones sin identificador', () => {
    const solicitud = { estado: 'PENDIENTE' }

    expect(
      obtenerAccionesSolicitudCliente(solicitud)
    ).toEqual({
      verDetalle: false,
      cancelar: false,
    })

    expect(
      obtenerAccionesSolicitudPrestador(solicitud)
    ).toEqual({
      verDetalle: false,
      aceptar: false,
      rechazar: false,
    })
  })

  test('no habilita acciones para estados desconocidos', () => {
    const solicitud = { id: 10, estado: 'EN_PROCESO' }

    expect(
      obtenerAccionesSolicitudCliente(solicitud).cancelar
    ).toBe(false)

    expect(
      obtenerAccionesSolicitudPrestador(solicitud).aceptar
    ).toBe(false)

    expect(
      obtenerAccionesSolicitudPrestador(solicitud).rechazar
    ).toBe(false)
  })
})
