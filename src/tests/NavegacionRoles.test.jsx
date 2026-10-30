
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom/vitest'
import NavegacionRoles from '../components/auth/NavegacionRoles'
import RutaProtegida from '../components/auth/RutaProtegida'
import { useAuth } from '../context/useAuth'
import { ROLES } from '../utils/roles'

vi.mock('../context/useAuth', () => ({
  useAuth: vi.fn(),
}))

function configurarUsuario(usuario, cargando = false) {
  vi.mocked(useAuth).mockReturnValue({
    usuario,
    cargando,
    autenticado: Boolean(usuario),
    login: vi.fn(),
    logout: vi.fn(),
  })
}

describe('F-04 - Navegación según rol', () => {
  it('muestra login y registro al visitante', () => {
    configurarUsuario(null)

    render(
      <MemoryRouter>
        <NavegacionRoles />
      </MemoryRouter>
    )

    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument()
    expect(screen.getByText('Crear cuenta')).toBeInTheDocument()
    expect(
      screen.queryByText('Panel de administración')
    ).not.toBeInTheDocument()
  })

  it('muestra navegación de cliente', () => {
    configurarUsuario({ id: 1, rol: ROLES.CLIENTE })

    render(
      <MemoryRouter initialEntries={['/cliente/solicitudes']}>
        <NavegacionRoles />
      </MemoryRouter>
    )

    expect(screen.getByText('Mi panel de cliente')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mis solicitudes' })).toHaveAttribute('href', '/cliente/solicitudes')
    expect(screen.getByRole('link', { name: 'Mis solicitudes' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('Mi panel de cliente')).not.toHaveAttribute('aria-current')
    expect(
      screen.queryByText('Panel de administración')
    ).not.toBeInTheDocument()
  })

  it('muestra navegación de prestador', () => {
    configurarUsuario({ id: 2, rol: ROLES.PRESTADOR })

    render(
      <MemoryRouter>
        <NavegacionRoles />
      </MemoryRouter>
    )

    expect(screen.getByText('Mi panel de prestador')).toBeInTheDocument()
  })

  it('muestra navegación de administrador', () => {
    configurarUsuario({ id: 3, rol: ROLES.ADMINISTRADOR })

    render(
      <MemoryRouter>
        <NavegacionRoles />
      </MemoryRouter>
    )

    expect(
      screen.getByText('Panel de administración')
    ).toBeInTheDocument()
  })

  it('bloquea el acceso a un rol no autorizado', () => {
    configurarUsuario({ id: 1, rol: ROLES.CLIENTE })

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <RutaProtegida rolesPermitidos={[ROLES.ADMINISTRADOR]}>
          <p>Contenido privado</p>
        </RutaProtegida>
      </MemoryRouter>
    )

    expect(
      screen.queryByText('Contenido privado')
    ).not.toBeInTheDocument()
  })

  it('permite acceder al rol autorizado', () => {
    configurarUsuario({ id: 3, rol: ROLES.ADMINISTRADOR })

    render(
      <MemoryRouter>
        <RutaProtegida rolesPermitidos={[ROLES.ADMINISTRADOR]}>
          <p>Contenido privado</p>
        </RutaProtegida>
      </MemoryRouter>
    )

    expect(screen.getByText('Contenido privado')).toBeInTheDocument()
  })

  it('espera mientras se verifica la sesión', () => {
    configurarUsuario(null, true)

    render(
      <MemoryRouter>
        <RutaProtegida rolesPermitidos={[ROLES.CLIENTE]}>
          <p>Contenido privado</p>
        </RutaProtegida>
      </MemoryRouter>
    )

    expect(screen.getByText('Verificando sesión...')).toBeInTheDocument()
  })
})
