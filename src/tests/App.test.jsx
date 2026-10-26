
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom/vitest'
import { AuthProvider } from '../context/AuthContext'
import App from '../App'

describe('App', () => {
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
