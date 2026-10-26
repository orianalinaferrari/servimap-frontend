import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PerfilPrestador from '../pages/PerfilPrestador'

const usuario = {
  id: 902,
  nombre: 'Ana',
  apellido: 'Perez',
  telefono: '1123456789',
  email: 'ana@example.com',
  oficios: ['Plomero'],
  ubicacion: 'Palermo',
  descripcion: 'Experiencia en reparaciones',
}

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({ usuario }),
}))

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('Integracion F-05 y F-06', () => {
  test('conserva los oficios recientes al editar otros datos del perfil', () => {
    render(
      <MemoryRouter>
        <PerfilPrestador />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /editar/i }))

    const perfilActualizado = {
      ...usuario,
      oficios: 'Plomero, Gasista',
    }

    localStorage.setItem(
      'servimap-perfil-902',
      JSON.stringify(perfilActualizado)
    )

    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: 'Ana Maria' },
    })

    fireEvent.click(
      screen.getByRole('button', { name: 'Guardar cambios' })
    )

    const guardado = JSON.parse(
      localStorage.getItem('servimap-perfil-902')
    )

    expect(guardado.nombre).toBe('Ana Maria')
    expect(guardado.oficios).toBe('Plomero, Gasista')
  })
})
