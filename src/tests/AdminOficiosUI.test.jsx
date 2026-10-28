import { afterEach, describe, expect, test } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { AdministracionOficios } from '../components/AdministracionOficios'
import { CLAVE_CATALOGO_OFICIOS } from '../utils/adminOficios'

afterEach(() => {
  cleanup()
  localStorage.removeItem(CLAVE_CATALOGO_OFICIOS)
})

describe('F-21 - Interfaz de administración de oficios', () => {
  test('muestra el catálogo inicial', () => {
    render(<AdministracionOficios />)

    expect(screen.getByText('Plomero')).toBeTruthy()
    expect(screen.getByText('Electricista')).toBeTruthy()
    expect(screen.getByText('Gasista')).toBeTruthy()
  })

  test('crea un oficio desde el formulario', () => {
    render(<AdministracionOficios />)

    fireEvent.change(screen.getByLabelText('Nombre del oficio'), {
      target: { value: 'Albañil' },
    })

    fireEvent.click(
      screen.getByRole('button', { name: 'Crear oficio' })
    )

    expect(screen.getByText('Albañil')).toBeTruthy()
    expect(
      screen.getByText('Oficio creado correctamente.')
    ).toBeTruthy()
  })

  test('valida nombres duplicados', () => {
    render(<AdministracionOficios />)

    fireEvent.change(screen.getByLabelText('Nombre del oficio'), {
      target: { value: 'Plomero' },
    })

    fireEvent.click(
      screen.getByRole('button', { name: 'Crear oficio' })
    )

    expect(
      screen.getByRole('alert').textContent
    ).toContain('Ya existe un oficio')
  })

  test('permite editar un oficio', () => {
    render(<AdministracionOficios />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Editar Plomero' })
    )

    fireEvent.change(screen.getByLabelText('Nombre del oficio'), {
      target: { value: 'Plomería' },
    })

    fireEvent.click(
      screen.getByRole('button', { name: 'Guardar cambios' })
    )

    expect(screen.getByText('Plomería')).toBeTruthy()
    expect(
      screen.getByText('Oficio modificado correctamente.')
    ).toBeTruthy()
  })

  test('permite desactivar y activar oficios', () => {
    render(<AdministracionOficios />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Desactivar Plomero' })
    )

    expect(
      screen.getByText('Oficio desactivado correctamente.')
    ).toBeTruthy()

    fireEvent.click(
      screen.getByRole('button', { name: 'Activar Plomero' })
    )

    expect(
      screen.getByText('Oficio activado correctamente.')
    ).toBeTruthy()
  })

  test('conserva los cambios en localStorage', () => {
    render(<AdministracionOficios />)

    fireEvent.change(screen.getByLabelText('Nombre del oficio'), {
      target: { value: 'Albañil' },
    })

    fireEvent.click(
      screen.getByRole('button', { name: 'Crear oficio' })
    )

    const guardado = JSON.parse(
      localStorage.getItem(CLAVE_CATALOGO_OFICIOS)
    )

    expect(guardado.some((oficio) => oficio.nombre === 'Albañil'))
      .toBe(true)
  })

  test('muestra acciones para cada oficio', () => {
    render(<AdministracionOficios />)

    const filas = screen.getAllByRole('row')

    expect(filas).toHaveLength(8)

    const fila = filas.find((elemento) =>
      within(elemento).queryByText('Plomero')
    )

    expect(
      within(fila).getByRole('button', { name: 'Editar Plomero' })
    ).toBeTruthy()
  })
})
