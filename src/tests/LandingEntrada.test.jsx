import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom/vitest'
import App from '../App'
import { AuthProvider } from '../context/AuthContext'

vi.mock('../components/DirectorioPrestadores', () => ({ default: () => <div>Directorio conservado</div> }))
afterEach(cleanup)

function inicio() {
  render(<MemoryRouter><AuthProvider><App /></AuthProvider></MemoryRouter>)
}

describe('Landing de acceso a ServiMap', () => {
  it.each([
    ['CLIENTE', 'Encontrar un profesional', 'Empezar como cliente'],
    ['PRESTADOR', 'Ofrecer mis servicios', 'Empezar como prestador'],
  ])('abre el registro con %s preseleccionado desde su tarjeta', async (rol, titulo, boton) => {
    inicio()
    const tarjeta = screen.getByRole('heading', { name: titulo }).closest('article')
    const enlace = within(tarjeta).getByRole('link', { name: boton })
    expect(enlace).toHaveAttribute('href', `/registro?rol=${rol}`)
    fireEvent.click(enlace)
    expect(screen.getByLabelText('Tipo de usuario')).toHaveValue(rol)
    expect(screen.queryByRole('option', { name: /Administrador/i })).not.toBeInTheDocument()
    expect(screen.getByLabelText('DNI')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '¿Qué querés hacer hoy?' })).not.toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /Volver al inicio/ })).toBeInTheDocument()
  })

  it('abre login desde el enlace inferior y conserva el directorio', () => {
    inicio()
    expect(screen.getByText('Directorio conservado')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: 'Iniciá sesión' }))
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('conserva los accesos superiores y una sola cabecera', async () => {
    inicio()
    const header = screen.getByRole('banner')
    expect(await within(header).findByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login')
    fireEvent.click(within(header).getByRole('link', { name: 'Crear cuenta' }))
    expect(screen.getByLabelText('Tipo de usuario')).toHaveValue('')
    expect(screen.getAllByRole('banner')).toHaveLength(1)
  })
})
