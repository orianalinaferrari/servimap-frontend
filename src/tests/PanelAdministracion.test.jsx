
import { AuthProvider } from '../context/AuthContext'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, test } from 'vitest'
import App from '../App'
import { PanelAdministracion } from '../components/PanelAdministracion'

afterEach(cleanup)

describe('PanelAdministracion', () => {
  test('abre el panel desde el menú principal', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Administración' })
    )

    expect(
      screen.getByRole('heading', { name: 'Panel de administración' })
    ).toBeTruthy()
  })

  test('muestra la sección de comentarios por defecto', () => {
    render(<PanelAdministracion />)

    expect(
      screen.getByRole('heading', { name: 'Comentarios publicados' })
    ).toBeTruthy()
  })

  test('cambia de sección al hacer clic', () => {
    render(<PanelAdministracion />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Administración de oficios' })
    )

    expect(
      screen.getByText(/administración de oficios\./)
    ).toBeTruthy()
  })
})
