import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { SelectorFotoPerfil } from '../components/perfil/SelectorFotoPerfil'

let seleccionar, eliminar, crear, revocar
const foto = 'https://imagenes.example.test/anterior.jpg'
beforeEach(() => {
  seleccionar = vi.fn(); eliminar = vi.fn(async () => {})
  crear = vi.fn().mockReturnValueOnce('blob:qa-1').mockReturnValueOnce('blob:qa-2')
  revocar = vi.fn()
  vi.stubGlobal('URL', class extends URL { static createObjectURL = crear; static revokeObjectURL = revocar })
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
function mostrar(props = {}) { return render(<SelectorFotoPerfil nombre="Ana Pérez" fotoActual={foto} onSeleccionar={seleccionar} {...props} />) }
const elegir = (file) => fireEvent.change(screen.getByLabelText('Cambiar foto'), { target: { files: [file] } })
const archivo = (tipo = 'image/png') => new File(['imagen'], 'foto.png', { type: tipo })

it('conserva la URL anterior, acepta archivos y no ofrece eliminar sin soporte', () => {
  const { container } = mostrar()
  expect(container.querySelector('img')).toHaveAttribute('src', foto)
  expect(screen.getByLabelText('Cambiar foto')).toHaveAttribute('accept', 'image/*')
  expect(screen.queryByRole('button', { name: 'Eliminar foto' })).toBeNull()
  expect(fetch).not.toHaveBeenCalled()
})
it.each([undefined, ''])('conserva iniciales si no hay foto (%s)', (nombre) => {
  mostrar({ fotoActual: null, nombre })
  expect(screen.getByText('Sin foto')).toBeInTheDocument()
})
it('usa iniciales si falla la foto anterior', () => {
  const { container } = mostrar()
  fireEvent.error(container.querySelector('img'))
  expect(screen.getByText('AP')).toBeInTheDocument()
})
it('previsualiza, entrega File solo tras leer la imagen y cancela sin persistir', () => {
  mostrar(); const file = archivo(); elegir(file)
  const preview = screen.getByRole('img', { name: 'Vista previa de foto' })
  expect(preview).toHaveAttribute('src', 'blob:qa-1')
  expect(seleccionar).not.toHaveBeenCalledWith(file)
  fireEvent.load(preview)
  expect(seleccionar).toHaveBeenLastCalledWith(file)
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar selección' }))
  expect(screen.queryByRole('img', { name: 'Vista previa de foto' })).toBeNull()
  expect(seleccionar).toHaveBeenLastCalledWith(null)
  expect(revocar).toHaveBeenCalledWith('blob:qa-1')
  expect(localStorage.length).toBe(0)
  expect(fetch).not.toHaveBeenCalled()
})
it('libera URLs temporales al cambiar de imagen y desmontar', () => {
  const { unmount } = mostrar(); elegir(archivo()); elegir(archivo('image/jpeg'))
  expect(revocar).toHaveBeenCalledWith('blob:qa-1')
  unmount(); expect(revocar).toHaveBeenCalledWith('blob:qa-2')
})
it.each(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])('prepara el formato permitido %s', (tipo) => {
  mostrar(); elegir(archivo(tipo)); expect(screen.getByRole('img', { name: 'Vista previa de foto' })).toBeInTheDocument()
})
it.each(['image/svg+xml', 'text/plain', ''])('rechaza formato no admitido %s', (tipo) => {
  mostrar(); elegir(archivo(tipo)); expect(screen.getByRole('alert')).toHaveTextContent('JPEG, PNG, WebP o GIF')
  expect(crear).not.toHaveBeenCalled()
})
it.each([0, 5 * 1024 * 1024 + 1])('rechaza tamaño inválido %s', (size) => {
  mostrar(); const file = archivo(); Object.defineProperty(file, 'size', { value: size }); elegir(file)
  expect(screen.getByRole('alert')).toHaveTextContent('5 MB'); expect(crear).not.toHaveBeenCalled()
})
it('admite el límite de 5 MB y conserva selección al cerrar el diálogo sin archivo', () => {
  mostrar(); const file = archivo(); Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }); elegir(file)
  fireEvent.change(screen.getByLabelText('Cambiar foto'), { target: { files: [] } })
  expect(screen.getByRole('img', { name: 'Vista previa de foto' })).toHaveAttribute('src', 'blob:qa-1')
})
it('informa error al decodificar y permite elegir otro archivo', () => {
  mostrar(); elegir(archivo()); fireEvent.error(screen.getByRole('img', { name: 'Vista previa de foto' }))
  expect(screen.getByRole('alert')).toHaveTextContent('No se pudo leer')
  expect(revocar).toHaveBeenCalledWith('blob:qa-1')
  elegir(archivo()); expect(screen.queryByRole('alert')).toBeNull()
})
it('informa si el navegador no puede crear la vista previa', () => {
  crear.mockReset().mockImplementation(() => { throw new Error('No disponible') })
  mostrar(); elegir(archivo()); expect(screen.getByRole('alert')).toHaveTextContent('No se pudo preparar')
})
it('eliminar solo invoca el contrato inyectado y espera confirmación', async () => {
  let resolver
  eliminar.mockImplementation(() => new Promise((resolve) => { resolver = resolve }))
  mostrar({ onEliminar: eliminar }); fireEvent.click(screen.getByRole('button', { name: 'Eliminar foto' }))
  expect(screen.getByRole('button', { name: 'Eliminando...' })).toBeDisabled()
  resolver(); await waitFor(() => expect(screen.getByRole('button', { name: 'Eliminar foto' })).toBeEnabled())
  expect(eliminar).toHaveBeenCalledOnce(); expect(fetch).not.toHaveBeenCalled()
})
it('mantiene foto anterior si falla eliminar', async () => {
  eliminar.mockRejectedValue(new Error('Error de API'))
  const { container } = mostrar({ onEliminar: eliminar }); fireEvent.click(screen.getByRole('button', { name: 'Eliminar foto' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Se conserva la imagen anterior')
  expect(container.querySelector('img')).toHaveAttribute('src', foto)
})
