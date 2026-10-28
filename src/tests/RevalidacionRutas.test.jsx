import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RutaProtegida from '../components/auth/RutaProtegida'
import { useAuth } from '../context/useAuth'
import { ROLES } from '../utils/roles'

vi.mock('../context/useAuth', () => ({
  useAuth: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function preparar(revalidarSesion) {
  vi.mocked(useAuth).mockReturnValue({
    usuario: { id: 1, rol: ROLES.CLIENTE },
    cargando: false,
    autenticado: true,
    sesionExpirada: false,
    revalidarSesion,
  })

  render(
    <MemoryRouter initialEntries={['/cliente']}>
      <RutaProtegida rolesPermitidos={[ROLES.CLIENTE]}>
        <h2>Panel privado</h2>
      </RutaProtegida>
    </MemoryRouter>
  )
}

describe('F-23 - Revalidacion de sesiones', () => {
  it('revalida antes de mostrar el panel', async () => {
    let resolver
    const revalidar = vi.fn(() => new Promise((resolve) => {
      resolver = resolve
    }))

    preparar(revalidar)

    expect(screen.queryByText('Panel privado')).toBeNull()
    expect(screen.getByText('Verificando sesión...')).toBeTruthy()

    resolver({ id: 1, rol: ROLES.CLIENTE })

    await waitFor(() => {
      expect(screen.getByText('Panel privado')).toBeTruthy()
    })

    expect(revalidar).toHaveBeenCalledTimes(1)
  })

  it('oculta el panel si falla la verificacion', async () => {
    const revalidar = vi.fn().mockRejectedValue(
      new Error('Sin conexion')
    )

    preparar(revalidar)

    expect(
      await screen.findByText(
        'No se pudo verificar la sesión con el servidor.'
      )
    ).toBeTruthy()

    expect(screen.queryByText('Panel privado')).toBeNull()
  })

  it('reintenta la consulta y recupera el acceso', async () => {
    const revalidar = vi.fn()
      .mockRejectedValueOnce(new Error('Sin conexion'))
      .mockResolvedValueOnce({
        id: 1,
        rol: ROLES.CLIENTE,
      })

    preparar(revalidar)

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Reintentar verificación',
      })
    )

    await waitFor(() => {
      expect(screen.getByText('Panel privado')).toBeTruthy()
    })

    expect(revalidar).toHaveBeenCalledTimes(2)
  })
})
