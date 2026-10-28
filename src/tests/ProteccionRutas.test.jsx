import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
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

function probarRuta(usuario, rolesPermitidos, opciones = {}) {
  vi.mocked(useAuth).mockReturnValue({
    usuario,
    cargando: opciones.cargando ?? false,
    sesionExpirada: opciones.sesionExpirada ?? false,
    autenticado: Boolean(usuario),
  })

  return render(
    <MemoryRouter initialEntries={['/privado']}>
      <Routes>
        <Route
          path="/privado"
          element={
            <RutaProtegida rolesPermitidos={rolesPermitidos}>
              <h2>Contenido protegido</h2>
            </RutaProtegida>
          }
        />
        <Route path="/login" element={<h2>Iniciar sesión</h2>} />
        <Route
          path="/acceso-denegado"
          element={<h2>Acceso denegado</h2>}
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('F-23 - Protección de rutas', () => {
  it('redirige al login sin autenticación', () => {
    probarRuta(null, [ROLES.CLIENTE])

    expect(screen.getByText('Iniciar sesión')).toBeTruthy()
    expect(screen.queryByText('Contenido protegido')).toBeNull()
  })

  it('permite acceder al cliente autorizado', () => {
    probarRuta({ id: 1, rol: 'CLIENTE' }, [ROLES.CLIENTE])

    expect(screen.getByText('Contenido protegido')).toBeTruthy()
  })

  it('impide que un cliente acceda al panel administrador', () => {
    probarRuta({ id: 1, rol: 'CLIENTE' }, [ROLES.ADMINISTRADOR])

    expect(screen.getByText('Acceso denegado')).toBeTruthy()
  })

  it('impide que un prestador acceda al panel cliente', () => {
    probarRuta({ id: 2, rol: 'PRESTADOR' }, [ROLES.CLIENTE])

    expect(screen.getByText('Acceso denegado')).toBeTruthy()
  })

  it('rechaza roles desconocidos', () => {
    probarRuta({ id: 3, rol: 'DESCONOCIDO' }, [ROLES.ADMINISTRADOR])

    expect(screen.getByText('Acceso denegado')).toBeTruthy()
  })

  it('no muestra contenido mientras verifica la sesión', () => {
    probarRuta(null, [ROLES.CLIENTE], { cargando: true })

    expect(screen.getByText('Verificando sesión...')).toBeTruthy()
    expect(screen.queryByText('Contenido protegido')).toBeNull()
  })

  it('redirige al login cuando la sesión expiró', () => {
    probarRuta(null, [ROLES.CLIENTE], { sesionExpirada: true })

    expect(screen.getByText('Iniciar sesión')).toBeTruthy()
    expect(screen.queryByText('Contenido protegido')).toBeNull()
  })
})
