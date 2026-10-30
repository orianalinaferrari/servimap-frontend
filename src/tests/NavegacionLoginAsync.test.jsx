import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login'

const { navegar, login, obtenerMiPerfil } = vi.hoisted(() => ({ navegar: vi.fn(), login: vi.fn(), obtenerMiPerfil: vi.fn() }))
vi.mock('react-router-dom', async (original) => ({ ...await original(), useNavigate: () => navegar }))
vi.mock('../context/useAuth', () => ({ useAuth: () => ({ login }) }))
vi.mock('../services/prestadoresService', () => ({ obtenerMiPerfil }))
const perfilCompleto = { descripcionProfesional: 'Electricista', zonaCobertura: 'Centro', telefono: '+54 11 5555-5555', oficios: [{ id: 'o1', nombre: 'Electricidad' }] }
beforeEach(() => obtenerMiPerfil.mockResolvedValue(perfilCompleto))
afterEach(() => { cleanup(); vi.resetAllMocks() })

function enviarLogin(entrada = '/login') {
  render(<MemoryRouter initialEntries={[entrada]}><Login /></MemoryRouter>)
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
    await waitFor(() => expect(navegar).toHaveBeenCalledWith('/cliente', { replace: true }))
    expect(screen.getByRole('button', { name: 'Ingresando...' }).disabled).toBe(true)
    await act(async () => resolver())
    expect(screen.getByRole('button', { name: 'Iniciar sesión' }).disabled).toBe(false)
  })
  it.each([
    ['PRESTADOR', '/prestador'],
    ['ADMINISTRADOR', '/admin'],
  ])('dirige la cuenta %s a su panel y no a la landing', async (rol, panel) => {
    login.mockResolvedValue({ id: 'qa', rol })
    navegar.mockResolvedValue()
    enviarLogin()
    await waitFor(() => expect(navegar).toHaveBeenCalledWith(panel, { replace: true }))
  })
  it('vuelve a la ruta protegida de origen solo si pertenece al rol', async () => {
    login.mockResolvedValue({ id: 'qa', rol: 'PRESTADOR' })
    navegar.mockResolvedValue()
    enviarLogin({ pathname: '/login', state: { from: '/prestador/oficios' } })
    await waitFor(() => expect(navegar).toHaveBeenCalledWith('/prestador/oficios', { replace: true }))
    cleanup(); navegar.mockClear()
    enviarLogin({ pathname: '/login', state: { from: '/admin' } })
    await waitFor(() => expect(navegar).toHaveBeenCalledWith('/prestador', { replace: true }))
  })
  it('envía al prestador con perfil incompleto a completar su perfil', async () => {
    login.mockResolvedValue({ id: 'qa', rol: 'PRESTADOR' })
    obtenerMiPerfil.mockResolvedValue({ ...perfilCompleto, zonaCobertura: ' ', oficios: [] })
    navegar.mockResolvedValue()
    enviarLogin({ pathname: '/login', state: { from: '/prestador/oficios' } })
    await waitFor(() => expect(navegar).toHaveBeenCalledWith('/prestador/completar-perfil', { replace: true }))
  })
  it('no bloquea el acceso al panel si falla la consulta del perfil', async () => {
    login.mockResolvedValue({ id: 'qa', rol: 'PRESTADOR' })
    obtenerMiPerfil.mockRejectedValue(new Error('Sin conexión'))
    navegar.mockResolvedValue()
    enviarLogin()
    await waitFor(() => expect(navegar).toHaveBeenCalledWith('/prestador', { replace: true }))
  })
  it('no consulta el perfil profesional para cliente ni administrador', async () => {
    login.mockResolvedValue({ id: 'qa', rol: 'ADMINISTRADOR' })
    navegar.mockResolvedValue()
    enviarLogin()
    await waitFor(() => expect(navegar).toHaveBeenCalledWith('/admin', { replace: true }))
    expect(obtenerMiPerfil).not.toHaveBeenCalled()
  })
  it('captura el rechazo de navegación sin dejar una promesa no manejada', async () => {
    login.mockResolvedValue({ id: 'qa', rol: 'CLIENTE' })
    navegar.mockRejectedValue(new Error('No se pudo abrir la pantalla.'))
    enviarLogin()
    expect((await screen.findByRole('alert')).textContent).toContain('No se pudo abrir la pantalla.')
    expect(screen.getByRole('button', { name: 'Iniciar sesión' }).disabled).toBe(false)
  })
})
