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
import SolicitudesPrestador from '../pages/SolicitudesPrestador'
import {
  obtenerSolicitudesPrestador,
  aceptarSolicitudPrestador,
  rechazarSolicitudPrestador,
} from '../services/solicitudesPrestadorService'

vi.mock('../services/solicitudesPrestadorService', () => ({
  obtenerSolicitudesPrestador: vi.fn(),
  aceptarSolicitudPrestador: vi.fn(),
  rechazarSolicitudPrestador: vi.fn(),
}))

const pendiente = {
  id: 201,
  estado: 'PENDIENTE',
  servicio: 'Plomería',
  cliente: { nombre: 'María', apellido: 'López' },
  descripcion: 'Reparar una pérdida de agua.',
  direccion: 'Av. Santa Fe 1234',
  fechaPreferida: '2026-11-10',
  fechaCreacion: '2026-10-20',
}

const aceptada = {
  id: 202,
  estado: 'ACEPTADA',
  servicio: 'Electricidad',
  nombreCliente: 'Carlos Pérez',
  descripcion: 'Revisar instalación.',
  fechaCreacion: '2026-10-21',
}

function mostrarPantalla() {
  return render(
    <MemoryRouter>
      <SolicitudesPrestador />
    </MemoryRouter>
  )
}

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})

describe('F-13 - Pantalla de solicitudes del prestador', () => {
  test('consulta las solicitudes al iniciar', async () => {
    vi.mocked(obtenerSolicitudesPrestador).mockResolvedValue([])

    mostrarPantalla()

    await waitFor(() => {
      expect(obtenerSolicitudesPrestador).toHaveBeenCalledOnce()
    })
  })

  test('muestra el estado vacío', async () => {
    vi.mocked(obtenerSolicitudesPrestador).mockResolvedValue([])

    mostrarPantalla()

    expect(
      await screen.findByText('Todavía no recibiste solicitudes')
    ).toBeTruthy()
  })

  test('muestra servicio, cliente y estado', async () => {
    vi.mocked(obtenerSolicitudesPrestador).mockResolvedValue([
      pendiente,
      aceptada,
    ])

    mostrarPantalla()

    expect(await screen.findByText('Plomería')).toBeTruthy()
    expect(screen.getByText('Electricidad')).toBeTruthy()
    expect(screen.getByText('María López')).toBeTruthy()
    expect(screen.getByText('Carlos Pérez')).toBeTruthy()
    expect(screen.getByText('Pendiente')).toBeTruthy()
    expect(screen.getByText('Aceptada')).toBeTruthy()
  })

  test('muestra el detalle de una solicitud', async () => {
    vi.mocked(obtenerSolicitudesPrestador).mockResolvedValue([pendiente])

    mostrarPantalla()

    fireEvent.click(
      await screen.findByRole('button', { name: 'Ver detalle' })
    )

    expect(
      screen.getByText('Reparar una pérdida de agua.')
    ).toBeTruthy()

    expect(screen.getByText('Av. Santa Fe 1234')).toBeTruthy()
  })

  test('permite cerrar el detalle', async () => {
    vi.mocked(obtenerSolicitudesPrestador).mockResolvedValue([pendiente])

    mostrarPantalla()

    fireEvent.click(
      await screen.findByRole('button', { name: 'Ver detalle' })
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Cerrar detalle' })
    )

    expect(
      screen.queryByText('Reparar una pérdida de agua.')
    ).toBeNull()
  })

  test('solo habilita respuestas en solicitudes pendientes', async () => {
    vi.mocked(obtenerSolicitudesPrestador).mockResolvedValue([
      pendiente,
      aceptada,
    ])

    mostrarPantalla()

    const listado = await screen.findByRole('region', {
      name: 'Listado de solicitudes recibidas',
    })

    const tarjetas = within(listado).getAllByRole('article')

    expect(
      within(tarjetas[0]).queryByRole('button', {
        name: 'Aceptar solicitud',
      })
    ).toBeNull()

    expect(
      within(tarjetas[1]).getByRole('button', {
        name: 'Aceptar solicitud',
      })
    ).toBeTruthy()
  })

  test('no acepta una solicitud sin confirmación', async () => {
    vi.mocked(obtenerSolicitudesPrestador).mockResolvedValue([pendiente])

    mostrarPantalla()

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Aceptar solicitud',
      })
    )

    expect(aceptarSolicitudPrestador).not.toHaveBeenCalled()
  })

  test('permite volver sin aceptar', async () => {
    vi.mocked(obtenerSolicitudesPrestador).mockResolvedValue([pendiente])

    mostrarPantalla()

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Aceptar solicitud',
      })
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Volver' })
    )

    expect(aceptarSolicitudPrestador).not.toHaveBeenCalled()

    expect(
      screen.queryByRole('button', {
        name: 'Confirmar aceptación',
      })
    ).toBeNull()
  })

  test('acepta y actualiza el estado', async () => {
    vi.mocked(obtenerSolicitudesPrestador)
      .mockResolvedValueOnce([pendiente])
      .mockResolvedValueOnce([
        { ...pendiente, estado: 'ACEPTADA' },
      ])

    vi.mocked(aceptarSolicitudPrestador).mockResolvedValue(null)

    mostrarPantalla()

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Aceptar solicitud',
      })
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Confirmar aceptación',
      })
    )

    await waitFor(() => {
      expect(aceptarSolicitudPrestador).toHaveBeenCalledWith(201)
    })

    expect(await screen.findByText('Aceptada')).toBeTruthy()

    expect(
      screen.queryByRole('button', {
        name: 'Aceptar solicitud',
      })
    ).toBeNull()
  })

  test('rechaza y actualiza el estado', async () => {
    vi.mocked(obtenerSolicitudesPrestador)
      .mockResolvedValueOnce([pendiente])
      .mockResolvedValueOnce([
        { ...pendiente, estado: 'RECHAZADA' },
      ])

    vi.mocked(rechazarSolicitudPrestador).mockResolvedValue(null)

    mostrarPantalla()

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Rechazar solicitud',
      })
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Confirmar rechazo',
      })
    )

    await waitFor(() => {
      expect(rechazarSolicitudPrestador).toHaveBeenCalledWith(201)
    })

    expect(await screen.findByText('Rechazada')).toBeTruthy()

    expect(
      screen.queryByRole('button', {
        name: 'Rechazar solicitud',
      })
    ).toBeNull()
  })

  test('informa errores de consulta', async () => {
    vi.mocked(obtenerSolicitudesPrestador).mockRejectedValue(
      new Error('Servidor no disponible')
    )

    mostrarPantalla()

    expect(
      await screen.findByText('Servidor no disponible')
    ).toBeTruthy()
  })

  test('permite reintentar una consulta fallida', async () => {
    vi.mocked(obtenerSolicitudesPrestador)
      .mockRejectedValueOnce(new Error('Error de conexión'))
      .mockResolvedValueOnce([pendiente])

    mostrarPantalla()

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Reintentar consulta',
      })
    )

    expect(await screen.findByText('Plomería')).toBeTruthy()
  })

  test('informa cuando falla la aceptación', async () => {
    vi.mocked(obtenerSolicitudesPrestador).mockResolvedValue([pendiente])

    vi.mocked(aceptarSolicitudPrestador).mockRejectedValue(
      new Error('No se pudo aceptar la solicitud.')
    )

    mostrarPantalla()

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Aceptar solicitud',
      })
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Confirmar aceptación',
      })
    )

    expect(
      await screen.findByText('No se pudo aceptar la solicitud.')
    ).toBeTruthy()
  })

  test('informa cuando falla el rechazo', async () => {
    vi.mocked(obtenerSolicitudesPrestador).mockResolvedValue([pendiente])

    vi.mocked(rechazarSolicitudPrestador).mockRejectedValue(
      new Error('No se pudo rechazar la solicitud.')
    )

    mostrarPantalla()

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Rechazar solicitud',
      })
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Confirmar rechazo',
      })
    )

    expect(
      await screen.findByText('No se pudo rechazar la solicitud.')
    ).toBeTruthy()
  })
})
