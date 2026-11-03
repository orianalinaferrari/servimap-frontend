import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { FormularioCuenta } from '../components/perfil/FormularioCuenta'

const usuario = { id: 'u1', nombre: 'Ana Pérez', email: 'ana@example.test', dni: '12345678' }
let guardar, cancelar, confirmar
beforeEach(() => { guardar = vi.fn(async (datos) => ({ ...usuario, ...datos })); cancelar = vi.fn(); confirmar = vi.fn() })
afterEach(cleanup)
function mostrar(dato = usuario) { return render(<FormularioCuenta usuario={dato} onGuardar={guardar} onCancelar={cancelar} onConfirmado={confirmar} />) }
const enviar = () => fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
it('prepara solo el nombre editable sin DNI, email ni campos profesionales', () => {
  const { container } = mostrar()
  expect(screen.getByLabelText('Nombre y apellido')).toHaveValue('Ana Pérez')
  expect(screen.getByText(usuario.email)).toBeInTheDocument(); expect(screen.getByText(usuario.dni)).toBeInTheDocument()
  expect(container.querySelectorAll('input')).toHaveLength(1)
  expect(screen.queryByLabelText('Zona de cobertura')).toBeNull()
  expect(fetch).not.toHaveBeenCalled()
})
it('permite cancelar sin llamar a guardar', () => {
  mostrar(); fireEvent.change(screen.getByLabelText('Nombre y apellido'), { target: { value: 'Otro nombre' } })
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' })); expect(cancelar).toHaveBeenCalledOnce(); expect(guardar).not.toHaveBeenCalled()
})
it('valida nombre vacío o ausente', () => {
  mostrar({ ...usuario, nombre: null }); enviar()
  expect(screen.getByRole('alert')).toHaveTextContent('El nombre es obligatorio'); expect(guardar).not.toHaveBeenCalled()
})
it('entrega solo nombre normalizado y confirma el usuario retornado por el contrato inyectado', async () => {
  mostrar(); fireEvent.change(screen.getByLabelText('Nombre y apellido'), { target: { value: '  Ana Gómez  ' } }); enviar()
  await waitFor(() => expect(confirmar).toHaveBeenCalledWith({ ...usuario, nombre: 'Ana Gómez' }))
  expect(guardar).toHaveBeenCalledWith({ nombre: 'Ana Gómez' }); expect(fetch).not.toHaveBeenCalled()
})
it.each([undefined, { ...usuario, id: 'otra-cuenta' }, { ...usuario, nombre: 'Valor anterior' }])('no confirma una respuesta inválida o ajena (%s)', async (dato) => {
  guardar.mockResolvedValue(dato); mostrar(); enviar()
  expect(await screen.findByRole('alert')).toHaveTextContent('El servidor no confirmó'); expect(confirmar).not.toHaveBeenCalled()
})
it('conserva el nombre tras un error y permite reintentar', async () => {
  guardar.mockRejectedValueOnce(new Error('Sin conexión')); mostrar()
  fireEvent.change(screen.getByLabelText('Nombre y apellido'), { target: { value: 'Ana Gómez' } }); enviar()
  expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión'); expect(screen.getByLabelText('Nombre y apellido')).toHaveValue('Ana Gómez')
  enviar(); await waitFor(() => expect(confirmar).toHaveBeenCalledOnce())
})
it('bloquea doble envío y cancelación hasta recibir confirmación', async () => {
  let resolver
  guardar.mockImplementation(() => new Promise((resolve) => { resolver = resolve })); mostrar(); enviar()
  expect(screen.getByLabelText('Nombre y apellido')).toBeDisabled(); expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  fireEvent.submit(screen.getByRole('form')); expect(guardar).toHaveBeenCalledOnce(); expect(confirmar).not.toHaveBeenCalled()
  resolver(usuario); await waitFor(() => expect(confirmar).toHaveBeenCalledOnce())
})
