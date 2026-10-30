import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { FormularioSolicitud } from '../components/FormularioSolicitud'
import { DetallePrestador } from '../components/DetallePrestador'
import { prestadoresMock } from '../data/prestadoresMock'
import { useAuth } from '../context/useAuth'
import { crearSolicitud } from '../services/solicitudesService'
import { ROLES } from '../utils/roles'

vi.mock('../context/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../services/solicitudesService', () => ({
  crearSolicitud: vi.fn(),
}))

const prestador = { ...prestadoresMock[0], oficiosCatalogo: [{ id: 'oficio-1', nombre: prestadoresMock[0].oficios[0] }] }

function completarFormulario() {
  fireEvent.change(screen.getByLabelText('Servicio *'), {
    target: { value: prestador.oficios[0] },
  })

  fireEvent.change(screen.getByLabelText('Descripción del trabajo *'), {
    target: { value: 'Necesito reparar una pérdida de agua en la cocina.' },
  })

  fireEvent.change(screen.getByLabelText('Dirección del servicio (opcional)'), {
    target: { value: 'Av. Santa Fe 1234' },
  })
}

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})

describe('F-11 - Formulario de solicitud', () => {
  test('muestra el prestador y sus servicios', () => {
    vi.mocked(useAuth).mockReturnValue({
      usuario: { id: 10, rol: ROLES.CLIENTE },
    })

    render(<FormularioSolicitud prestador={prestador} onCancelar={() => {}} />)

    expect(screen.getByText(prestador.nombre)).toBeTruthy()
    expect(screen.getByRole('option', { name: prestador.oficios[0] })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Enviar solicitud' })).toBeTruthy()
  })

  test('no permite enviar como visitante', () => {
    vi.mocked(useAuth).mockReturnValue({ usuario: null })

    render(<FormularioSolicitud prestador={prestador} onCancelar={() => {}} />)

    expect(screen.getByRole('button', { name: 'Enviar solicitud' }).disabled).toBe(true)
    expect(screen.getByText(/iniciar sesión con una cuenta de cliente/i)).toBeTruthy()
  })

  test('no permite enviar como prestador', () => {
    vi.mocked(useAuth).mockReturnValue({
      usuario: { id: 20, rol: ROLES.PRESTADOR },
    })

    render(<FormularioSolicitud prestador={prestador} onCancelar={() => {}} />)

    expect(screen.getByRole('button', { name: 'Enviar solicitud' }).disabled).toBe(true)
  })

  test('muestra errores cuando faltan campos obligatorios', () => {
    vi.mocked(useAuth).mockReturnValue({
      usuario: { id: 10, rol: ROLES.CLIENTE },
    })

    render(<FormularioSolicitud prestador={prestador} onCancelar={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    expect(screen.getByText('Seleccioná un servicio.')).toBeTruthy()
    expect(screen.getByText(/La descripción es obligatoria/i)).toBeTruthy()
    expect(crearSolicitud).not.toHaveBeenCalled()
  })

  test('envía los datos correctos y confirma el resultado', async () => {
    vi.mocked(useAuth).mockReturnValue({
      usuario: { id: 10, rol: ROLES.CLIENTE },
    })

    vi.mocked(crearSolicitud).mockResolvedValue({
      id: 100,
      estado: 'PENDIENTE',
    })

    render(<FormularioSolicitud prestador={prestador} onCancelar={() => {}} />)

    completarFormulario()

    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    await waitFor(() => {
      expect(crearSolicitud).toHaveBeenCalledWith({
        prestadorId: prestador.id,
        oficioId: 'oficio-1',
        contactoPreferido: '',
        descripcion: 'Necesito reparar una pérdida de agua en la cocina.',
        direccion: 'Av. Santa Fe 1234',
      })
    })

    expect(
      await screen.findByText('Tu solicitud fue enviada correctamente.')
    ).toBeTruthy()
  })

  test('muestra el error si falla el envío', async () => {
    vi.mocked(useAuth).mockReturnValue({
      usuario: { id: 10, rol: ROLES.CLIENTE },
    })

    vi.mocked(crearSolicitud).mockRejectedValue(
      new Error('No se pudo conectar con el servidor.')
    )

    render(<FormularioSolicitud prestador={prestador} onCancelar={() => {}} />)

    completarFormulario()

    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    expect(
      await screen.findByText('No se pudo conectar con el servidor.')
    ).toBeTruthy()
  })

  test('permite volver al perfil del prestador', () => {
    vi.mocked(useAuth).mockReturnValue({
      usuario: { id: 10, rol: ROLES.CLIENTE },
    })

    const onCancelar = vi.fn()

    render(<FormularioSolicitud prestador={prestador} onCancelar={onCancelar} />)

    fireEvent.click(screen.getByRole('button', { name: 'Volver al prestador' }))

    expect(onCancelar).toHaveBeenCalledOnce()
  })

  test('abre el formulario desde el detalle del prestador', () => {
    vi.mocked(useAuth).mockReturnValue({
      usuario: { id: 10, rol: ROLES.CLIENTE },
    })

    render(<DetallePrestador prestador={prestador} onVolver={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: 'Solicitar servicio' }))

    expect(screen.getByText('Crear solicitud de servicio')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Enviar solicitud' })).toBeTruthy()
  })

  test('no permite solicitar a un prestador no disponible', () => {
    vi.mocked(useAuth).mockReturnValue({
      usuario: { id: 10, rol: ROLES.CLIENTE },
    })

    render(
      <DetallePrestador
        prestador={{ ...prestador, disponible: false }}
        onVolver={() => {}}
      />
    )

    expect(
      screen.getByRole('button', { name: 'Solicitar servicio' }).disabled
    ).toBe(true)
  })
})
