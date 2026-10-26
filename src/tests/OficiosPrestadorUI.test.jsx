import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import OficiosPrestador from '../pages/OficiosPrestador'

const usuarioPrueba = {
  id: 901,
  nombre: 'Ana',
  apellido: 'Pérez',
  rol: 'PRESTADOR',
  oficios: ['Plomero'],
}

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({
    usuario: usuarioPrueba,
    cargando: false,
  }),
}))

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('F-06 Pantalla de gestión de oficios', () => {
  test('muestra los oficios asociados al prestador', () => {
    render(<OficiosPrestador />)

    expect(screen.getByRole('heading', { name: 'Mis oficios' }))
      .toBeTruthy()

    expect(screen.getByRole('button', { name: 'Quitar Plomero' }))
      .toBeTruthy()
  })

  test('permite agregar un oficio del catálogo', () => {
    render(<OficiosPrestador />)

    fireEvent.change(screen.getByLabelText('Seleccionar oficio'), {
      target: { value: 'Electricista' },
    })

    fireEvent.click(screen.getByRole('button', {
      name: 'Agregar oficio',
    }))

    expect(screen.getByRole('button', { name: 'Quitar Electricista' }))
      .toBeTruthy()
  })

  test('impide agregar el mismo oficio dos veces', () => {
    render(<OficiosPrestador />)

    fireEvent.change(screen.getByLabelText('Seleccionar oficio'), {
      target: { value: 'Plomero' },
    })

    fireEvent.click(screen.getByRole('button', {
      name: 'Agregar oficio',
    }))

    expect(screen.getByRole('status').textContent)
      .toContain('Ese oficio ya está agregado')
  })

  test('permite quitar un oficio', () => {
    render(<OficiosPrestador />)

    fireEvent.click(screen.getByRole('button', {
      name: 'Quitar Plomero',
    }))

    expect(screen.getByText('No tenés oficios seleccionados.'))
      .toBeTruthy()
  })

  test('guarda los oficios en el perfil del prestador', () => {
    render(<OficiosPrestador />)

    fireEvent.change(screen.getByLabelText('Seleccionar oficio'), {
      target: { value: 'Gasista' },
    })

    fireEvent.click(screen.getByRole('button', {
      name: 'Agregar oficio',
    }))

    fireEvent.click(screen.getByRole('button', {
      name: 'Guardar oficios',
    }))

    const guardado = JSON.parse(
      localStorage.getItem('servimap-perfil-901')
    )

    expect(guardado.oficios).toBe('Plomero, Gasista')
    expect(screen.getByRole('status').textContent)
      .toContain('Oficios guardados')
  })

  test('no permite guardar sin ningún oficio', () => {
    render(<OficiosPrestador />)

    fireEvent.click(screen.getByRole('button', {
      name: 'Quitar Plomero',
    }))

    fireEvent.click(screen.getByRole('button', {
      name: 'Guardar oficios',
    }))

    expect(screen.getByRole('status').textContent)
      .toContain('Debés tener al menos un oficio')

    expect(localStorage.getItem('servimap-perfil-901'))
      .toBeNull()
  })
})
