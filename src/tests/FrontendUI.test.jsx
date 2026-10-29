import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Registro from '../pages/Registro'
import CampoContrasena from '../components/auth/CampoContrasena'

afterEach(cleanup)

describe('Navegación al registro y visibilidad de contraseñas', () => {
  it.each(['CLIENTE', 'PRESTADOR'])('conserva el rol %s recibido desde inicio', (rol) => {
    render(<MemoryRouter initialEntries={[`/registro?rol=${rol}`]}><Registro /></MemoryRouter>)
    expect(screen.getByLabelText('Tipo de usuario').value).toBe(rol)
    expect(screen.getByRole('link', { name: 'Iniciar sesión' }).getAttribute('href')).toBe('/login')
  })

  it('ignora roles que no están disponibles para registro', () => {
    render(<MemoryRouter initialEntries={['/registro?rol=ADMINISTRADOR']}><Registro /></MemoryRouter>)
    expect(screen.getByLabelText('Tipo de usuario').value).toBe('')
  })

  it('muestra y oculta cada contraseña sin perder el valor ni enviar el formulario', () => {
    render(<MemoryRouter><Registro /></MemoryRouter>)
    for (const [label, nombre] of [['Contraseña', 'contraseña'], ['Confirmar contraseña', 'confirmación de contraseña']]) {
      const campo = screen.getByLabelText(label)
      fireEvent.change(campo, { target: { value: 'clave-de-prueba' } })
      fireEvent.click(screen.getByRole('button', { name: `Mostrar ${nombre}` }))
      expect(campo.type).toBe('text')
      expect(campo.value).toBe('clave-de-prueba')
      fireEvent.click(screen.getByRole('button', { name: `Ocultar ${nombre}` }))
      expect(campo.type).toBe('password')
      expect(campo.value).toBe('clave-de-prueba')
    }
    expect(screen.queryAllByRole('alert')).toHaveLength(0)
  })

  it('conserva las propiedades del campo de login al alternar visibilidad', () => {
    render(<CampoContrasena id="contrasena" autoComplete="current-password" defaultValue="clave" aria-invalid="true" />)
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(document.getElementById('contrasena').autocomplete).toBe('current-password')
    expect(document.getElementById('contrasena').value).toBe('clave')
  })
})
