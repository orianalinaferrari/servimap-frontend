import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SolicitudesCliente from '../pages/SolicitudesCliente'
import {
  obtenerSolicitudesCliente,
  cancelarSolicitudCliente,
} from '../services/solicitudesClienteService'

vi.mock('../services/solicitudesClienteService', () => ({
  obtenerSolicitudesCliente: vi.fn(),
  cancelarSolicitudCliente: vi.fn(),
}))

const pendiente = {
  id: 101,
  estado: 'PENDIENTE',
  servicio: 'Plomería',
  prestador: { nombre: 'Juan Pérez' },
  descripcion: 'Reparar una pérdida de agua en la cocina.',
  direccion: 'Av. Santa Fe 1234',
  fechaPreferida: '2026-11-10',
  fechaCreacion: '2026-10-20',
}

const aceptada = {
  id: 102,
  estado: 'ACEPTADA',
  servicio: 'Electricidad',
  nombrePrestador: 'Ana García',
  descripcion: 'Revisar instalación eléctrica.',
  direccion: 'Av. Córdoba 456',
  fechaCreacion: '2026-10-21',
}

function mostrarPantalla() {
  return render(
    <MemoryRouter>
      <SolicitudesCliente />
    </MemoryRouter>
  )
}

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})

describe('F-12 - Pantalla de solicitudes del cliente', () => {
  test('consulta solicitudes al iniciar', async () => {
    vi.mocked(obtenerSolicitudesCliente).mockResolvedValue([])

    mostrarPantalla()

    await waitFor(() => {
      expect(obtenerSolicitudesCliente).toHaveBeenCalledOnce()
    })
  })

  test('muestra el estado vacío', async () => {
    vi.mocked(obtenerSolicitudesCliente).mockResolvedValue([])

    mostrarPantalla()

    expect(
      await screen.findByText('Todavía no tenés solicitudes')
    ).toBeTruthy()
  })

  test('muestra servicio, prestador y estado', async () => {
    vi.mocked(obtenerSolicitudesCliente).mockResolvedValue([
      pendiente,
      aceptada,
    ])

    mostrarPantalla()

    expect(await screen.findByText('Plomería')).toBeTruthy()
    expect(screen.getByText('Electricidad')).toBeTruthy()
    expect(screen.getByText('Juan Pérez')).toBeTruthy()
    expect(screen.getByText('Ana García')).toBeTruthy()
    expect(screen.getByText('Pendiente')).toBeTruthy()
    expect(screen.getByText('Aceptada')).toBeTruthy()
  })

  test('muestra el detalle de la solicitud', async () => {
    vi.mocked(obtenerSolicitudesCliente).mockResolvedValue([pendiente])

    mostrarPantalla()

    const boton = await screen.findByRole('button', {
      name: 'Ver detalle',
    })

    fireEvent.click(boton)

    expect(
      screen.getByText('Reparar una pérdida de agua en la cocina.')
    ).toBeTruthy()

    expect(screen.getByText('Av. Santa Fe 1234')).toBeTruthy()
    expect(screen.getByText('2026-11-10')).toBeTruthy()
  })

  test('permite cerrar el detalle', async () => {
    vi.mocked(obtenerSolicitudesCliente).mockResolvedValue([pendiente])

    mostrarPantalla()

    fireEvent.click(
      await screen.findByRole('button', { name: 'Ver detalle' })
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Cerrar detalle' })
    )

    expect(
      screen.queryByText('Reparar una pérdida de agua en la cocina.')
    ).toBeNull()
  })

  test('solo permite preparar cancelación de pendientes', async () => {
    vi.mocked(obtenerSolicitudesCliente).mockResolvedValue([
      pendiente,
      aceptada,
    ])

    mostrarPantalla()

    const listado = await screen.findByRole('region', {
      name: 'Listado de solicitudes',
    })

    const tarjetas = within(listado).getAllByRole('article')

    expect(
      within(tarjetas[0]).queryByRole('button', {
        name: 'Preparar cancelación',
      })
    ).toBeNull()

    expect(
      within(tarjetas[1]).getByRole('button', {
        name: 'Preparar cancelación',
      })
    ).toBeTruthy()
  })

  test('no cancela sin confirmación', async () => {
    vi.mocked(obtenerSolicitudesCliente).mockResolvedValue([pendiente])

    mostrarPantalla()

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Preparar cancelación',
      })
    )

    expect(cancelarSolicitudCliente).not.toHaveBeenCalled()
  })

  test('confirma cancelación y actualiza listado', async () => {
    vi.mocked(obtenerSolicitudesCliente)
      .mockResolvedValueOnce([pendiente])
      .mockResolvedValueOnce([
        { ...pendiente, estado: 'CANCELADA' },
      ])

    vi.mocked(cancelarSolicitudCliente).mockResolvedValue(null)

    mostrarPantalla()

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Preparar cancelación',
      })
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Confirmar cancelación',
      })
    )

    await waitFor(() => {
      expect(cancelarSolicitudCliente).toHaveBeenCalledWith(101)
    })

    expect(await screen.findByText('Cancelada')).toBeTruthy()

    expect(
      screen.queryByRole('button', {
        name: 'Preparar cancelación',
      })
    ).toBeNull()
  })

  test('muestra errores de consulta', async () => {
    vi.mocked(obtenerSolicitudesCliente).mockRejectedValue(
      new Error('Servidor no disponible')
    )

    mostrarPantalla()

    expect(
      await screen.findByText('Servidor no disponible')
    ).toBeTruthy()

    expect(
      screen.getByRole('button', { name: 'Reintentar' })
    ).toBeTruthy()
  })

  test('permite reintentar una consulta fallida', async () => {
    vi.mocked(obtenerSolicitudesCliente)
      .mockRejectedValueOnce(new Error('Error de conexión'))
      .mockResolvedValueOnce([pendiente])

    mostrarPantalla()

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Reintentar',
      })
    )

    expect(await screen.findByText('Plomería')).toBeTruthy()
  })

  test('informa cuando falla la cancelación', async () => {
    vi.mocked(obtenerSolicitudesCliente).mockResolvedValue([pendiente])

    vi.mocked(cancelarSolicitudCliente).mockRejectedValue(
      new Error('No se pudo cancelar la solicitud.')
    )

    mostrarPantalla()

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Preparar cancelación',
      })
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Confirmar cancelación',
      })
    )

    expect(
      await screen.findByText('No se pudo cancelar la solicitud.')
    ).toBeTruthy()
  })
})

describe('F-15 - Cancelación de solicitud', () => {
  test('ver detalle no abre la confirmación de cancelación', async () => {
    vi.mocked(obtenerSolicitudesCliente).mockResolvedValue([pendiente])

    mostrarPantalla()

    fireEvent.click(
      await screen.findByRole('button', { name: 'Ver detalle' })
    )

    expect(
      screen.getByText('Reparar una pérdida de agua en la cocina.')
    ).toBeTruthy()

    expect(
      screen.queryByRole('button', {
        name: 'Confirmar cancelación',
      })
    ).toBeNull()

    expect(cancelarSolicitudCliente).not.toHaveBeenCalled()
  })

  test('preparar cancelación muestra una confirmación explícita', async () => {
    vi.mocked(obtenerSolicitudesCliente).mockResolvedValue([pendiente])

    mostrarPantalla()

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Preparar cancelación',
      })
    )

    expect(
      screen.getByRole('button', {
        name: 'Confirmar cancelación',
      })
    ).toBeTruthy()

    expect(cancelarSolicitudCliente).not.toHaveBeenCalled()
  })

  test('volver abandona la cancelación sin llamar al servicio', async () => {
    vi.mocked(obtenerSolicitudesCliente).mockResolvedValue([pendiente])

    mostrarPantalla()

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Preparar cancelación',
      })
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Volver' })
    )

    expect(
      screen.queryByRole('button', {
        name: 'Confirmar cancelación',
      })
    ).toBeNull()

    expect(cancelarSolicitudCliente).not.toHaveBeenCalled()
  })

  test('una solicitud finalizada no permite cancelar', async () => {
    vi.mocked(obtenerSolicitudesCliente).mockResolvedValue([
      { ...pendiente, estado: 'FINALIZADA' },
    ])

    mostrarPantalla()

    expect(await screen.findByText('Finalizada')).toBeTruthy()

    expect(
      screen.queryByRole('button', {
        name: 'Preparar cancelación',
      })
    ).toBeNull()

    expect(
      screen.queryByRole('button', {
        name: 'Confirmar cancelación',
      })
    ).toBeNull()
  })
})

describe('F-15 - Validaciones de integración', () => {
  test('conserva el éxito e informa si falla la recarga posterior', async () => {
    vi.mocked(obtenerSolicitudesCliente)
      .mockResolvedValueOnce([pendiente])
      .mockRejectedValueOnce(new Error('No se pudo actualizar el listado'))

    vi.mocked(cancelarSolicitudCliente).mockResolvedValue(null)

    mostrarPantalla()

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Preparar cancelación',
      })
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Confirmar cancelación',
      })
    )

    expect(
      await screen.findByText('No se pudo actualizar el listado')
    ).toBeTruthy()

    expect(
      screen.getByText('La cancelación fue confirmada por el servidor.')
    ).toBeTruthy()

    expect(cancelarSolicitudCliente).toHaveBeenCalledTimes(1)
  })

  test('un conflicto de estado no informa una cancelación exitosa', async () => {
    vi.mocked(obtenerSolicitudesCliente).mockResolvedValue([pendiente])

    vi.mocked(cancelarSolicitudCliente).mockRejectedValue(
      new Error('La solicitud cambió de estado y ya no permite esta operación.')
    )

    mostrarPantalla()

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Preparar cancelación',
      })
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Confirmar cancelación',
      })
    )

    expect(
      await screen.findByText(
        'La solicitud cambió de estado y ya no permite esta operación.'
      )
    ).toBeTruthy()

    expect(
      screen.queryByText('La cancelación fue confirmada por el servidor.')
    ).toBeNull()

    expect(cancelarSolicitudCliente).toHaveBeenCalledTimes(1)
  })
})
