import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import Registro from '../pages/Registro'

afterEach(() => {
  cleanup()
})

describe('Registro de usuario', () => {
  it('muestra el formulario', () => {
    render(<Registro />)

    expect(
      screen.getByRole('heading', { name: 'Crear cuenta' })
    ).toBeTruthy()

    expect(screen.getByLabelText('Nombre')).toBeTruthy()
    expect(screen.getByLabelText('Email')).toBeTruthy()
  })

  it('permite seleccionar el rol Prestador', () => {
    render(<Registro />)

    const selector = screen.getByLabelText('Tipo de usuario')

    fireEvent.change(selector, {
      target: { value: 'PRESTADOR' },
    })

    expect(selector.value).toBe('PRESTADOR')
  })

  it('muestra errores cuando los campos están vacíos', () => {
    render(<Registro />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Crear cuenta' })
    )

    expect(screen.getAllByRole('alert')).toHaveLength(7)
    expect(screen.getByText('El nombre es obligatorio')).toBeTruthy()
  })

  it('detecta un email inválido', () => {
    render(<Registro />)

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'correo-invalido' },
    })

    fireEvent.click(
      screen.getByRole('button', { name: 'Crear cuenta' })
    )

    expect(screen.getByText('Ingresá un email válido')).toBeTruthy()
  })

  it('detecta contraseñas diferentes', () => {
    render(<Registro />)

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

