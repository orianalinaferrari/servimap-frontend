import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../context/authContextInstance'
import App from '../App'

afterEach(cleanup)

function montar({ usuario = null, cargando = false, logout = vi.fn(), ruta = '/acceso-denegado' } = {}) {
  render(<AuthContext.Provider value={{ usuario, cargando, logout, autenticado: Boolean(usuario) }}>
    <MemoryRouter initialEntries={[ruta]}><App /></MemoryRouter>
  </AuthContext.Provider>)
  return logout
}

describe('Header con sesión', () => {
  it('ubica el avatar inmediatamente a la izquierda de «Cerrar sesión» y quita el texto anterior', () => {
    montar({ usuario: { nombre: 'Martín Pérez', rol: 'CLIENTE' } })
    const header = screen.getByRole('banner')
    const avatar = within(header).getByRole('button', { name: 'Ir a mi perfil' })
    expect(avatar).toHaveTextContent('MP')
    expect(avatar.nextElementSibling).toBe(within(header).getByRole('button', { name: 'Cerrar sesión' }))
    expect(header).not.toHaveTextContent('Sesión iniciada')
  })
  it('cierra sesión y vuelve a la landing', async () => {
    const logout = montar({ usuario: { nombre: 'Ana', rol: 'PRESTADOR' }, logout: vi.fn().mockResolvedValue() })
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(await screen.findByRole('heading', { name: /Lo que necesitás/ })).toBeInTheDocument()
    expect(logout).toHaveBeenCalledTimes(1)
  })
  it.each([
    [new Error('Fallo de red al cerrar.'), 'Fallo de red al cerrar.'],
    ['rechazo sin Error', 'No se pudo cerrar la sesión.'],
  ])('informa el error de cierre (%s) y vuelve a habilitar el botón', async (fallo, mensaje) => {
    montar({ usuario: { nombre: 'Ana', rol: 'CLIENTE' }, logout: vi.fn().mockRejectedValue(fallo) })
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(mensaje)
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeEnabled()
  })
  it('ignora un segundo clic mientras cierra sesión', async () => {
    let resolver
    const logout = montar({ usuario: { nombre: 'Ana', rol: 'CLIENTE' }, logout: vi.fn(() => new Promise((r) => { resolver = r })) })
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    const cerrando = screen.getByRole('button', { name: 'Cerrando sesión...' })
    expect(cerrando).toBeDisabled()
    fireEvent.click(cerrando)
    expect(logout).toHaveBeenCalledTimes(1)
    resolver()
    expect(await screen.findByRole('heading', { name: /Lo que necesitás/ })).toBeInTheDocument()
  })
  it('muestra el estado de verificación y no muestra avatar sin sesión', () => {
    montar({ cargando: true })
    expect(within(screen.getByRole('banner')).getAllByRole('status')[0]).toHaveTextContent('Verificando sesión...')
    cleanup()
    montar()
    expect(screen.queryByRole('button', { name: 'Ir a mi perfil' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull()
  })
})
