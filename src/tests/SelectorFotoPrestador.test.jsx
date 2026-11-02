import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { FormularioPerfilPrestador } from '../components/prestador/FormularioPerfilPrestador'
import { perfilPrueba } from './helpers/contratos'

let crear, revocar, guardar
beforeEach(() => {
  crear = vi.fn((file) => `blob:preview-${file.name}`)
  revocar = vi.fn()
  vi.stubGlobal('URL', class extends URL { static createObjectURL = crear; static revokeObjectURL = revocar })
  guardar = vi.fn().mockResolvedValue({})
})
afterEach(cleanup)
function mostrar() { return render(<FormularioPerfilPrestador perfil={perfilPrueba} onGuardar={guardar} onCancelar={() => {}} />) }
function seleccionar(nombre, tipo, bytes = 12) {
  const archivo = new File([new Uint8Array(bytes)], nombre, { type: tipo })
  fireEvent.change(screen.getByLabelText('Foto de perfil'), { target: { files: [archivo] } })
}
describe('Selección de foto sin inventar una subida', () => {
  it.each([['foto.jpg', 'image/jpeg'], ['foto.jpeg', 'image/jpeg'], ['foto.png', 'image/png'], ['foto.webp', 'image/webp']])('permite vista previa de %s sin enviar el archivo', (nombre, tipo) => {
    const { container } = mostrar()
    expect(screen.queryByLabelText('URL de foto de perfil')).toBeNull()
    seleccionar(nombre, tipo)
    expect(container.querySelector('img')).toHaveAttribute('src', `blob:preview-${nombre}`)
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()
    fireEvent.submit(container.querySelector('form'))
    expect(guardar).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('todavía no permite subir fotos')
  })
  it.each([['foto.gif', 'image/gif'], ['foto.jpg', 'text/plain'], ['foto.svg', 'image/png']])('rechaza tipo o extensión no permitidos: %s', (nombre, tipo) => {
    mostrar(); seleccionar(nombre, tipo)
    expect(screen.getByRole('alert')).toHaveTextContent('JPG, JPEG, PNG o WebP')
    expect(crear).not.toHaveBeenCalled()
  })
  it('limita la vista previa a 5 MB', () => {
    mostrar(); seleccionar('grande.png', 'image/png', 5 * 1024 * 1024 + 1)
    expect(screen.getByRole('alert')).toHaveTextContent('5 MB')
    expect(crear).not.toHaveBeenCalled()
  })
  it('reemplaza y libera previews, y permite guardar otros datos al quitar la selección', async () => {
    const { unmount } = mostrar()
    seleccionar('una.png', 'image/png'); seleccionar('otra.webp', 'image/webp')
    expect(revocar).toHaveBeenCalledWith('blob:preview-una.png')
    fireEvent.click(screen.getByRole('button', { name: 'Quitar selección de foto' }))
    expect(revocar).toHaveBeenCalledWith('blob:preview-otra.webp')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(guardar.mock.calls[0][0]).not.toHaveProperty('fotoPerfil')
    unmount()
  })
  it('libera la imagen al salir y muestra respaldo ante imagen ilegible', () => {
    const { container, unmount } = mostrar()
    seleccionar('rota.png', 'image/png')
    fireEvent.error(container.querySelector('img'))
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo abrir')
    expect(container.querySelector('img')).toBeNull()
    seleccionar('otra.png', 'image/png'); unmount()
    expect(revocar).toHaveBeenCalledWith('blob:preview-otra.png')
  })
})
