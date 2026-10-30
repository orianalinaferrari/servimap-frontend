
import { afterEach, describe, it, expect } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom/vitest'
import { AuthProvider } from '../context/AuthContext'
import App from '../App'

afterEach(cleanup)

describe('App', () => {
  it.each(['/login', '/registro?rol=CLIENTE', '/registro?rol=PRESTADOR'])(
    'muestra un solo header público en %s y permite volver al inicio', (ruta) => {
      render(<MemoryRouter initialEntries={[ruta]}><AuthProvider><App /></AuthProvider></MemoryRouter>)
      expect(screen.getAllByRole('banner')).toHaveLength(1)
      expect(screen.getByRole('banner')).toHaveClass('servimap-header-minimo')
      expect(screen.getByRole('link', { name: 'ServiMap, inicio' })).toBeInTheDocument()
      fireEvent.click(screen.getByRole('link', { name: /Volver al inicio/ }))
      expect(screen.getByRole('heading', { name: /prestadores de servicios/ })).toBeInTheDocument()
    }
  )

  it('muestra la página de registro', () => {
    render(
      <MemoryRouter initialEntries={['/registro']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    )

    expect(
      screen.getByRole('heading', { name: 'Crear cuenta' })
    ).toBeInTheDocument()
  })
})
