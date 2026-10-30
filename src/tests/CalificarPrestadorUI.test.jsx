import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SolicitudesCliente from '../pages/SolicitudesCliente'
import { obtenerSolicitudesCliente } from '../services/solicitudesClienteService'
import { registrarCalificacion } from '../services/calificacionesService'

vi.mock('../services/solicitudesClienteService', () => ({
  obtenerSolicitudesCliente: vi.fn(),
  cancelarSolicitudCliente: vi.fn(),
  confirmarFinalizacionCliente: vi.fn(),
}))

vi.mock('../services/calificacionesService', () => ({
  registrarCalificacion: vi.fn(),
}))

const finalizada = {
  id: 501,
  estado: 'FINALIZADA',
  servicio: 'Plomería',
  prestador: { nombre: 'Juan Pérez' },
  fechaCreacion: '2026-10-20',
}

function mostrarPantalla(solicitudes) {
  vi.mocked(obtenerSolicitudesCliente).mockResolvedValue(solicitudes)

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

describe('F-17 - Calificación de prestador', () => {
  test('solo permite calificar trabajos finalizados', async () => {
    mostrarPantalla([
      finalizada,
      { ...finalizada, id: 502, estado: 'PENDIENTE' },
    ])

    await screen.findByRole('button', {
      name: 'Calificar prestador',
    })

    expect(
      screen.getAllByRole('button', { name: 'Calificar prestador' })
    ).toHaveLength(1)
  })

  test('abre el formulario de calificación', async () => {
    mostrarPantalla([finalizada])

    fireEvent.click(
      await screen.findByRole('button', { name: 'Calificar prestador' })
    )

    expect(screen.getByText('Calificar al prestador')).toBeTruthy()
    expect(screen.getByRole('radio', { name: '5 estrellas' })).toBeTruthy()
  })

  test('registra una calificación y bloquea una segunda', async () => {
    vi.mocked(registrarCalificacion).mockResolvedValue({
      puntaje: 5,
      comentario: 'Excelente trabajo',
    })

    mostrarPantalla([finalizada])

    fireEvent.click(
      await screen.findByRole('button', { name: 'Calificar prestador' })
    )

    fireEvent.click(screen.getByRole('radio', { name: '5 estrellas' }))

    fireEvent.change(
      screen.getByLabelText('Comentario (opcional)'),
      { target: { value: 'Excelente trabajo' } }
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Enviar calificación' })
    )

    await waitFor(() => {
      expect(registrarCalificacion).toHaveBeenCalledWith(501, {
        puntaje: 5,
        comentario: 'Excelente trabajo',
      })
    })

    expect(
      await screen.findByText('La calificación fue registrada correctamente.')
    ).toBeTruthy()

    expect(
      screen.queryByRole('button', { name: 'Calificar prestador' })
    ).toBeNull()

    expect(screen.getByText('Excelente trabajo')).toBeTruthy()
  })

  test('no permite volver a calificar una solicitud ya calificada', async () => {
    mostrarPantalla([
      {
        ...finalizada,
        calificacion: { puntaje: 4, comentario: 'Buen servicio' },
      },
    ])

    await screen.findByText('Plomería')

    expect(
      screen.queryByRole('button', { name: 'Calificar prestador' })
    ).toBeNull()
  })

  test('informa un error del servidor', async () => {
    vi.mocked(registrarCalificacion).mockRejectedValue(
      new Error('La solicitud ya fue calificada.')
    )

    mostrarPantalla([finalizada])

    fireEvent.click(
      await screen.findByRole('button', { name: 'Calificar prestador' })
    )

    fireEvent.click(screen.getByRole('radio', { name: '4 estrellas' }))

    fireEvent.click(
      screen.getByRole('button', { name: 'Enviar calificación' })
    )

    expect(
      await screen.findByText('La solicitud ya fue calificada.')
    ).toBeTruthy()
  })
})