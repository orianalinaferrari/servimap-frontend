import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import Login from '../pages/Login'
import AppRoutes from '../routes/AppRoutes'
import { BuscadorPrestadores } from '../components/BuscadorPrestadores'
import { prestadoresMock } from '../data/prestadoresMock'
import * as authService from '../services/authService'

vi.mock('../services/authService', () => ({
  iniciarSesion: vi.fn(),
  cerrarSesion: vi.fn(),
  obtenerSesion: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  authService.obtenerSesion.mockResolvedValue(null)
})

afterEach(cleanup)

describe('Correcciones de la F-26', () => {
  test('DEF-01: el formulario de login está dentro de la tarjeta', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    )

    const tarjeta = container.querySelector('.login-tarjeta')

    expect(tarjeta).toBeTruthy()
    expect(tarjeta.querySelector('form')).toBeTruthy()
  })

  test('DEF-03: la página no encontrada permite volver al inicio', () => {
    render(
      <MemoryRouter initialEntries={['/no-existe']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toBeTruthy()
  })

  test('DEF-04: avisa si el precio máximo es negativo', () => {
    render(
      <MemoryRouter>
        <BuscadorPrestadores prestadores={prestadoresMock} />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText('Precio máximo'), {
      target: { value: '-5000' },
    })

    expect(
      screen.getByText('El precio máximo no puede ser negativo.')
    ).toBeTruthy()
  })
})