import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { FormularioPerfilPrestador } from '../components/prestador/FormularioPerfilPrestador'
import { perfilPrueba } from './helpers/contratos'
afterEach(cleanup)
describe('Regresión: PUT de perfil compatible con validarContacto/validarTextos', () => {
  it('omite contactos y descripción aún no configurados, no manda cadenas vacías rechazadas', async () => {
    const guardar = vi.fn().mockResolvedValue({})
    render(<FormularioPerfilPrestador perfil={{ ...perfilPrueba, descripcionProfesional: null, telefono: null, whatsapp: null, emailContacto: null }} onGuardar={guardar} onCancelar={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(guardar).toHaveBeenCalledTimes(1))
    const payload = guardar.mock.calls[0][0]
    for (const campo of ['descripcionProfesional','telefono','whatsapp','emailContacto']) expect(payload).not.toHaveProperty(campo)
    expect(payload).toMatchObject({ zonaCobertura: perfilPrueba.zonaCobertura, disponible: true })
  })
  it('no intenta borrar un contacto existente con un valor que el backend no admite', async () => {
    const guardar = vi.fn()
    render(<FormularioPerfilPrestador perfil={{ ...perfilPrueba, telefono: '+54 11 4567-8901' }} onGuardar={guardar} onCancelar={() => {}} />)
    fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Teléfono')
    expect(guardar).not.toHaveBeenCalled()
  })
  it('valida el formato telefónico admitido por el controlador', async () => {
    const guardar = vi.fn()
    render(<FormularioPerfilPrestador perfil={perfilPrueba} onGuardar={guardar} onCancelar={() => {}} />)
    fireEvent.change(screen.getByLabelText('WhatsApp'), { target: { value: 'no-es-un-numero' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('WhatsApp')
    expect(guardar).not.toHaveBeenCalled()
  })
})
