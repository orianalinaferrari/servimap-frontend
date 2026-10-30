import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import Registro from '../pages/Registro'
import { MemoryRouter } from 'react-router-dom'

afterEach(() => {
  cleanup()
})

describe('Registro de usuario', () => {
  it('muestra el formulario', () => {
    render(<MemoryRouter><Registro /></MemoryRouter>)

    expect(
      screen.getByRole('heading', { name: 'Crear cuenta' })
    ).toBeTruthy()

    expect(screen.getByLabelText('Nombre y apellido')).toBeTruthy()
    expect(screen.getByLabelText('Email')).toBeTruthy()
  })

  it('permite seleccionar el rol Prestador', () => {
    render(<MemoryRouter><Registro /></MemoryRouter>)

    const selector = screen.getByLabelText('Tipo de usuario')

    fireEvent.change(selector, {
      target: { value: 'PRESTADOR' },
    })

    expect(selector.value).toBe('PRESTADOR')
  })

  it('muestra errores cuando los campos están vacíos', () => {
    render(<MemoryRouter><Registro /></MemoryRouter>)

    fireEvent.click(
      screen.getByRole('button', { name: 'Crear cuenta' })
    )

    expect(screen.getAllByRole('alert')).toHaveLength(6)
    expect(screen.getByText('El nombre es obligatorio')).toBeTruthy()
  })

  it('detecta un email inválido', () => {
    render(<MemoryRouter><Registro /></MemoryRouter>)

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'correo-invalido' },
    })

    fireEvent.click(
      screen.getByRole('button', { name: 'Crear cuenta' })
    )

    expect(screen.getByText('Ingresá un email válido')).toBeTruthy()
  })

  it('detecta contraseñas diferentes', () => {
    render(<MemoryRouter><Registro /></MemoryRouter>)

    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'clave123' },
    })

    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), {
      target: { value: 'otraClave' },
    })

    fireEvent.click(
      screen.getByRole('button', { name: 'Crear cuenta' })
    )

    expect(screen.getByText('Las contraseñas no coinciden')).toBeTruthy()
  })
})

