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
import PanelPrestador from '../pages/PanelPrestador'
import { obtenerSolicitudesPrestador } from '../services/solicitudesPrestadorService'

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({
    usuario: {
      id: 15,
      nombre: 'María',
      rol: 'PRESTADOR',
    },
  }),
}))

vi.mock('../services/solicitudesPrestadorService', () => ({
  obtenerSolicitudesPrestador: vi.fn(),
}))

const solicitudes = [
  {
    id: 101,
    estado: 'PENDIENTE',
    servicio: 'Plomería',
    fechaCreacion: '2026-10-20',
  },
  {
    id: 102,
    estado: 'ACEPTADA',
    servicio: 'Electricidad',
    fechaCreacion: '2026-10-25',
  },
  {
    id: 103,
    estado: 'FINALIZADA',
    servicio: 'Pintura',
    fechaCreacion: '2026-10-22',
  },
  {
    id: 104,
    estado: 'RECHAZADA',
    servicio: 'Carpintería',
    fechaCreacion: '2026-10-18',
  },
]

function mostrarPanel() {
  return render(
    <MemoryRouter>
      <PanelPrestador />
    </MemoryRouter>
  )
}

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})

describe('F-19 - Panel del prestador', () => {
  test('muestra el título y el saludo personalizado', async () => {
    vi.mocked(obtenerSolicitudesPrestador).mockResolvedValue([])

    mostrarPanel()

    expect(
      screen.getByRole('heading', { name: 'Panel del prestador' })
    ).toBeTruthy()

    expect(screen.getByText(/Hola, María/)).toBeTruthy()

    await waitFor(() => {
      expect(obtenerSolicitudesPrestador).toHaveBeenCalledOnce()
    })
  })

  test('consulta las solicitudes al iniciar', async () => {
    vi.mocked(obtenerSolicitudesPrestador).mockResolvedValue([])

    mostrarPanel()

    await waitFor(() => {
      expect(obtenerSolicitudesPrestador).toHaveBeenCalledOnce()
    })
  })

  test('muestra indicadores calculados con las solicitudes recibidas', async () => {
    vi.mocked(obtenerSolicitudesPrestador).mockResolvedValue(solicitudes)

    mostrarPanel()

    const resumen = await screen.findByRole('heading', {
      name: 'Resumen de actividad',
    })

    expect(resumen).toBeTruthy()

    await screen.findByText('Plomería')

    const indicadores = document.querySelectorAll(
      '.panel-prestador-indicador'
    )

    expect(indicadores).toHaveLength(4)

    expect(indicadores[0].textContent).toContain('4')
    expect(indicadores[1].textContent).toContain('1')
    expect(indicadores[2].textContent).toContain('1')
    expect(indicadores[3].textContent).toContain('1')
  })

  test('muestra actividad reciente ordenada', async () => {
    vi.mocked(obtenerSolicitudesPrestador).mockResolvedValue(solicitudes)

    mostrarPanel()

    await screen.findByText('Electricidad')

    const lista = document.querySelector(
      '.panel-prestador-lista'
    )

    const elementos = within(lista).getAllByRole('listitem')

    expect(elementos[0].textContent).toContain('Electricidad')
    expect(elementos[1].textContent).toContain('Pintura')
    expect(elementos[2].textContent).toContain('Plomería')
    expect(elementos[3].textContent).toContain('Carpintería')
  })

  test('muestra un estado vacío sin solicitudes', async () => {
    vi.mocked(obtenerSolicitudesPrestador).mockResolvedValue([])

    mostrarPanel()

    expect(
      await screen.findByText('Todavía no recibiste solicitudes.')
    ).toBeTruthy()
  })

  test('muestra errores del servicio', async () => {
    vi.mocked(obtenerSolicitudesPrestador).mockRejectedValue(
      new Error('No se pudo conectar con el servidor.')
    )

    mostrarPanel()

    expect(
      await screen.findByRole('alert')
    ).toHaveProperty(
      'textContent',
      expect.stringContaining('No se pudo conectar con el servidor.')
    )
  })

  test('permite reintentar después de un error', async () => {
    vi.mocked(obtenerSolicitudesPrestador)
      .mockRejectedValueOnce(new Error('Error temporal'))
      .mockResolvedValueOnce(solicitudes)

    mostrarPanel()

    fireEvent.click(
      await screen.findByRole('button', { name: 'Reintentar' })
    )

    expect(await screen.findByText('Plomería')).toBeTruthy()

    expect(obtenerSolicitudesPrestador).toHaveBeenCalledTimes(2)
  })

  test('permite actualizar la actividad', async () => {
    vi.mocked(obtenerSolicitudesPrestador)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(solicitudes)

    mostrarPanel()

    await screen.findByText('Todavía no recibiste solicitudes.')

    fireEvent.click(
      screen.getByRole('button', { name: 'Actualizar' })
    )

    expect(await screen.findByText('Plomería')).toBeTruthy()

    expect(obtenerSolicitudesPrestador).toHaveBeenCalledTimes(2)
  })

  test('conserva los accesos a solicitudes, perfil y oficios', async () => {
    vi.mocked(obtenerSolicitudesPrestador).mockResolvedValue([])

    mostrarPanel()

    const navegacion = screen.getByRole('navigation', {
      name: 'Opciones del prestador',
    })

    expect(
      within(navegacion).getByRole('link', {
        name: /Solicitudes recibidas/,
      }).getAttribute('href')
    ).toBe('/prestador/solicitudes')

    expect(
      within(navegacion).getByRole('link', {
        name: /Mi perfil/,
      }).getAttribute('href')
    ).toBe('/prestador/perfil')

    expect(
      within(navegacion).getByRole('link', {
        name: /Mis oficios/,
      }).getAttribute('href')
    ).toBe('/prestador/oficios')

    await waitFor(() => {
      expect(obtenerSolicitudesPrestador).toHaveBeenCalledOnce()
    })
  })

  test('mantiene los accesos disponibles ante un error', async () => {
    vi.mocked(obtenerSolicitudesPrestador).mockRejectedValue(
      new Error('Servidor no disponible')
    )

    mostrarPanel()

    await screen.findByRole('alert')

    expect(
      screen.getByRole('navigation', {
        name: 'Opciones del prestador',
      })
    ).toBeTruthy()
  })

  test('muestra el enlace para ver todas las solicitudes', async () => {
    vi.mocked(obtenerSolicitudesPrestador).mockResolvedValue(solicitudes)

    mostrarPanel()

    const enlace = await screen.findByRole('link', {
      name: 'Ver todas',
    })

    expect(enlace.getAttribute('href')).toBe(
      '/prestador/solicitudes'
    )
  })
})