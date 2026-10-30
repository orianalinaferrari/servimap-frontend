import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom/vitest'
import App from '../App'
import { AuthProvider } from '../context/AuthContext'

vi.mock('../components/DirectorioPrestadores', () => ({ default: () => <div>Directorio conservado</div> }))
afterEach(cleanup)
// jsdom no implementa la API modal; el foco y Escape se verifican en Chrome.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
})
afterAll(() => {
  delete HTMLDialogElement.prototype.showModal
  delete HTMLDialogElement.prototype.close
})

function inicio(ruta = '/') {
  render(<MemoryRouter initialEntries={[ruta]}><AuthProvider><App /></AuthProvider></MemoryRouter>)
}

describe('Landing final de ServiMap', () => {
  it.each([
    ['CLIENTE', 'Crear cuenta cliente', 'Empezar como cliente'],
    ['PRESTADOR', 'Ofrecer mis servicios', 'Empezar como prestador'],
  ].flatMap(([rol, titulo, boton]) => [[rol, titulo], [rol, boton]]))('el enlace %s / %s abre el formulario con el rol correcto', async (rol, nombre) => {
    inicio()
    fireEvent.click(screen.getByRole('link', { name: nombre }))
    expect(screen.getByLabelText('Tipo de usuario')).toHaveValue(rol)
    expect(screen.queryByRole('option', { name: /Administrador/i })).not.toBeInTheDocument()
    expect(screen.getByLabelText('DNI')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /Volver al inicio/ })).toBeInTheDocument()
  })

  it('abre login desde el enlace inferior', () => {
    inicio()
    fireEvent.click(screen.getByRole('link', { name: 'Iniciá sesión' }))
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('inicio contiene solo la landing y dirige al directorio real', () => {
    inicio()
    expect(screen.queryByText('Directorio conservado')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Inicio' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Iniciar sesión' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Crear cuenta' })).not.toBeInTheDocument()
    const explorar = screen.getByRole('link', { name: 'Explorar servicios' })
    expect(explorar).toHaveAttribute('href', '/prestadores')
    fireEvent.click(explorar)
    expect(screen.getByRole('heading', { name: 'Encontrá prestadores de servicios' })).toBeInTheDocument()
    expect(screen.getByText('Directorio conservado')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '¿Qué querés hacer hoy?' })).not.toBeInTheDocument()
  })

  it('la URL pública del directorio permite acceso directo', () => {
    inicio('/prestadores')
    expect(screen.getByText('Directorio conservado')).toBeInTheDocument()
  })

  it('explica ambos roles en un modal y permite cerrarlo', () => {
    inicio()
    fireEvent.click(screen.getByRole('button', { name: 'Cómo funciona' }))
    const modal = screen.getByRole('dialog', { name: 'Cómo funciona ServiMap' })
    expect(modal).toHaveAttribute('open')
    expect(within(modal).getByRole('heading', { name: 'Como cliente' })).toBeInTheDocument()
    expect(within(modal).getByRole('heading', { name: 'Como prestador' })).toBeInTheDocument()
    fireEvent.click(within(modal).getByRole('button', { name: 'Cerrar explicación' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cómo funciona' }))
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
