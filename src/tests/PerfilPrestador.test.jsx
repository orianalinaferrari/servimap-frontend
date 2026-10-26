
import { afterEach, describe, expect, test, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { VistaPerfilPrestador } from '../components/prestador/VistaPerfilPrestador'
import { FormularioPerfilPrestador } from '../components/prestador/FormularioPerfilPrestador'
import { validarPerfilPrestador } from '../utils/perfilPrestador'

afterEach(() => {
  cleanup()
})

const perfil = {
  nombre: 'Ana',
  apellido: 'Pérez',
  telefono: '1123456789',
  email: 'ana@example.com',
  oficios: 'Plomería, Gasista',
  ubicacion: 'Palermo',
  descripcion: 'Profesional con experiencia',
}

describe('F-05 Perfil de prestador', () => {
  test('muestra los datos del prestador', () => {
    render(
      <VistaPerfilPrestador
        perfil={perfil}
        onEditar={() => {}}
      />
    )

    expect(screen.getByText(/Ana Pérez/)).toBeTruthy()
    expect(screen.getByText('Plomería')).toBeTruthy()
    expect(screen.getByText('Gasista')).toBeTruthy()
    expect(screen.getByText(/Palermo/)).toBeTruthy()
  })

  test('permite editar y guardar datos válidos', () => {
    const guardar = vi.fn()

    render(
      <FormularioPerfilPrestador
        perfil={perfil}
        onGuardar={guardar}
        onCancelar={() => {}}
      />
    )

    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: 'María' },
    })

    fireEvent.click(
      screen.getByRole('button', { name: 'Guardar cambios' })
    )

    expect(guardar).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'María' })
    )
  })

  test('no permite guardar un nombre vacío', () => {
    const guardar = vi.fn()

    render(
      <FormularioPerfilPrestador
        perfil={{ ...perfil, nombre: '' }}
        onGuardar={guardar}
        onCancelar={() => {}}
      />
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Guardar cambios' })
    )

    expect(
      screen.getByText('El nombre es obligatorio')
    ).toBeTruthy()

    expect(guardar).not.toHaveBeenCalled()
  })

  test('rechaza un correo inválido', () => {
    const errores = validarPerfilPrestador({
      ...perfil,
      email: 'correo-invalido',
    })

    expect(errores.email).toBe('Ingresá un correo válido')
  })
})
