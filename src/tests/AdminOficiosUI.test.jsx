import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { AdministracionOficios } from '../components/AdministracionOficios'
import { BASE, instalarHttp, respuesta } from './helpers/contratos'
let catalogo, http
beforeEach(() => {
  vi.stubEnv('VITE_API_URL', BASE)
  catalogo = [{ id: 'o1', nombre: 'Plomero', activo: true }]
  http = instalarHttp((url, config) => {
    if (config.method === 'POST') { const dato = { id: 'o2', ...JSON.parse(config.body), activo: true }; catalogo.push(dato); return respuesta(dato, 201) }
    if (config.method === 'PUT') { catalogo[0] = { ...catalogo[0], ...JSON.parse(config.body) }; return respuesta(catalogo[0]) }
    if (config.method === 'PATCH') { catalogo[0] = { ...catalogo[0], ...JSON.parse(config.body) }; return respuesta(catalogo[0]) }
    return respuesta(catalogo)
  })
})
afterEach(() => { cleanup(); vi.unstubAllEnvs() })
async function mostrar() { render(<AdministracionOficios />); await screen.findByText('Plomero') }
describe('Administración remota de oficios', () => {
  it('carga el catálogo completo con endpoint administrativo', async () => { await mostrar(); expect(http.mock.calls[0][0]).toBe(BASE + '/api/oficios/todos') })
  it('crea un oficio y muestra la respuesta del servidor', async () => {
    await mostrar(); fireEvent.change(screen.getByLabelText('Nombre del oficio'), { target: { value: 'Albañil' } }); fireEvent.click(screen.getByRole('button', { name: 'Crear oficio' }))
    expect(await screen.findByText('Albañil')).toBeInTheDocument()
    expect(http.mock.calls.find(([, c]) => c.method === 'POST')[0]).toBe(BASE + '/api/oficios')
  })
  it('conserva errores 409 del backend sin insertar duplicados', async () => {
    await mostrar(); http.mockResolvedValueOnce(respuesta({ error: 'Ya existe un oficio con ese nombre' }, 409))
    fireEvent.change(screen.getByLabelText('Nombre del oficio'), { target: { value: 'Plomero' } }); fireEvent.click(screen.getByRole('button', { name: 'Crear oficio' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe')
    expect(screen.getAllByRole('row')).toHaveLength(2)
  })
  it('edita con PUT y el identificador remoto', async () => {
    await mostrar(); fireEvent.click(screen.getByRole('button', { name: 'Editar Plomero' })); fireEvent.change(screen.getByLabelText('Nombre del oficio'), { target: { value: 'Plomería' } }); fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Plomería')).toBeInTheDocument()
    expect(http.mock.calls.find(([, c]) => c.method === 'PUT')[0]).toBe(BASE + '/api/oficios/o1')
  })
  it('desactiva y activa con PATCH sin borrar el oficio', async () => {
    await mostrar(); fireEvent.click(screen.getByRole('button', { name: 'Desactivar Plomero' })); fireEvent.click(await screen.findByRole('button', { name: 'Activar Plomero' }))
    await screen.findByRole('button', { name: 'Desactivar Plomero' })
    expect(http.mock.calls.filter(([, c]) => c.method === 'PATCH').map(([, c]) => JSON.parse(c.body))).toEqual([{ activo: false }, { activo: true }])
  })
  it('no persiste el catálogo en localStorage', async () => {
    await mostrar(); const guardar = vi.spyOn(Storage.prototype, 'setItem'); fireEvent.click(screen.getByRole('button', { name: 'Desactivar Plomero' })); await waitFor(() => expect(screen.getByText('Inactivo')).toBeInTheDocument()); expect(guardar).not.toHaveBeenCalled(); guardar.mockRestore()
  })
  it('muestra errores de consulta y permite reintentar', async () => {
    http.mockResolvedValueOnce(respuesta({ error: 'Sin permisos' }, 403)); render(<AdministracionOficios />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Sin permisos')
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar catálogo' })); expect(await screen.findByText('Plomero')).toBeInTheDocument()
  })
})
