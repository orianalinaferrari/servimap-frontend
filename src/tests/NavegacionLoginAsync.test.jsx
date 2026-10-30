import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login'

const { navegar, login } = vi.hoisted(() => ({ navegar: vi.fn(), login: vi.fn() }))
vi.mock('react-router-dom', async (original) => ({ ...await original(), useNavigate: () => navegar }))
vi.mock('../context/useAuth', () => ({ useAuth: () => ({ login }) }))
afterEach(() => { cleanup(); vi.resetAllMocks() })

function enviarLogin() {
  render(<MemoryRouter><Login /></MemoryRouter>)
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'cliente@example.test' } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'clave-de-prueba' } })
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
}

describe('Finalización de la navegación tras login', () => {
  it('mantiene el envío bloqueado hasta que la navegación finaliza', async () => {
    login.mockResolvedValue({ id: 'qa', rol: 'CLIENTE' })
    let resolver
    navegar.mockReturnValue(new Promise(resolve => { resolver = resolve }))
    enviarLogin()
    await waitFor(() => expect(navegar).toHaveBeenCalledWith('/'))
    expect(screen.getByRole('button', { name: 'Ingresando...' }).disabled).toBe(true)
    await act(async () => resolver())
    expect(screen.getByRole('button', { name: 'Iniciar sesión' }).disabled).toBe(false)
  })
  it('captura el rechazo de navegación sin dejar una promesa no manejada', async () => {
    login.mockResolvedValue({ id: 'qa', rol: 'CLIENTE' })
    navegar.mockRejectedValue(new Error('No se pudo abrir la pantalla.'))
    enviarLogin()
    expect((await screen.findByRole('alert')).textContent).toContain('No se pudo abrir la pantalla.')
    expect(screen.getByRole('button', { name: 'Iniciar sesión' }).disabled).toBe(false)
  })
})
