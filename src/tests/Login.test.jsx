
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import Login from '../pages/Login'
import * as authService from '../services/authService'

vi.mock('../services/authService', () => ({
  iniciarSesion: vi.fn(),
  cerrarSesion: vi.fn(),
  obtenerSesion: vi.fn(),
}))

function renderizarLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  authService.obtenerSesion.mockResolvedValue(null)
})

afterEach(() => {
  cleanup()
})

describe('Inicio de sesión - F-03', () => {
  test('muestra el formulario de inicio de sesión', () => {
    renderizarLogin()

    expect(
      screen.getByRole('heading', { name: /iniciar sesión/i })
    ).toBeTruthy()

    expect(
      screen.getByLabelText(/correo electrónico|email/i)
    ).toBeTruthy()

    expect(
      screen.getByLabelText(/contraseña/i)
    ).toBeTruthy()
  })

  test('no permite iniciar sesión con campos vacíos', () => {
    renderizarLogin()

    fireEvent.click(
      screen.getByRole('button', { name: /iniciar sesión/i })
    )

    expect(authService.iniciarSesion).not.toHaveBeenCalled()
  })

  test('no permite iniciar sesión con un email inválido', () => {
    renderizarLogin()

    fireEvent.change(
      screen.getByLabelText(/correo electrónico|email/i),
      { target: { value: 'correo-invalido' } }
    )

    fireEvent.change(
      screen.getByLabelText(/contraseña/i),
      { target: { value: 'Clave1234' } }
    )

    fireEvent.click(
      screen.getByRole('button', { name: /iniciar sesión/i })
    )

    expect(authService.iniciarSesion).not.toHaveBeenCalled()
  })

  test('envía las credenciales cuando los datos son válidos', async () => {
    authService.iniciarSesion.mockResolvedValue({
      id: 1,
      nombre: 'Usuario de prueba',
      rol: 'CLIENTE',
    })

    renderizarLogin()

    fireEvent.change(
      screen.getByLabelText(/correo electrónico|email/i),
      { target: { value: 'cliente@servimap.com' } }
    )

    fireEvent.change(
      screen.getByLabelText(/contraseña/i),
      { target: { value: 'Clave1234' } }
    )

    fireEvent.click(
      screen.getByRole('button', { name: /iniciar sesión/i })
    )

    await waitFor(() => {
      expect(authService.iniciarSesion).toHaveBeenCalledWith(
        'cliente@servimap.com',
        'Clave1234'
      )
    })
  })

  test('muestra un error cuando las credenciales son incorrectas', async () => {
    authService.iniciarSesion.mockRejectedValue(
      new Error('Email o contraseña incorrectos.')
    )

    renderizarLogin()

    fireEvent.change(
      screen.getByLabelText(/correo electrónico|email/i),
      { target: { value: 'cliente@servimap.com' } }
    )

    fireEvent.change(
      screen.getByLabelText(/contraseña/i),
      { target: { value: 'ClaveIncorrecta' } }
    )

    fireEvent.click(
      screen.getByRole('button', { name: /iniciar sesión/i })
    )

    expect(
      await screen.findByText(/email o contraseña incorrectos/i)
    ).toBeTruthy()
  })
})
