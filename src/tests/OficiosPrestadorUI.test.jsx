import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import OficiosPrestador from '../pages/OficiosPrestador'
import { BASE, instalarHttp, respuesta, perfilPrueba } from './helpers/contratos'
let http, perfil
beforeEach(() => {
  vi.stubEnv('VITE_API_URL', BASE); perfil = { ...perfilPrueba }
  http = instalarHttp((url, config) => {
    if (url.pathname === '/api/oficios') return respuesta([{ id: 'o1', nombre: 'Plomero' }, { id: 'o2', nombre: 'Electricista' }])
    if (config.method === 'PUT') { perfil = { ...perfil, oficios: JSON.parse(config.body).oficioIds.map((id) => ({ id, nombre: id === 'o1' ? 'Plomero' : 'Electricista' })) } }
    return respuesta(perfil)
  })
})
afterEach(() => { cleanup(); vi.unstubAllEnvs() })
async function mostrar() { render(<OficiosPrestador />); await screen.findByRole('button', { name: 'Quitar Plomero' }) }
describe('Oficios remotos del prestador', () => {
  it('consulta catálogo real y selección del perfil', async () => { await mostrar(); expect(screen.getByRole('option', { name: 'Electricista' })).toHaveValue('o2') })
  it('agrega un oficio y envía sus IDs por PUT', async () => {
    await mostrar(); fireEvent.change(screen.getByLabelText('Seleccionar oficio'), { target: { value: 'o2' } }); fireEvent.click(screen.getByRole('button', { name: 'Agregar oficio' })); fireEvent.click(screen.getByRole('button', { name: 'Guardar oficios' })); await screen.findByText('Oficios guardados en el servidor.')
    const [url, config] = http.mock.calls.find(([, c]) => c.method === 'PUT'); expect(url).toBe(BASE + '/api/prestadores/me/oficios'); expect(JSON.parse(config.body)).toEqual({ oficioIds: ['o1','o2'] })
  })
  it('evita duplicados', async () => { await mostrar(); fireEvent.change(screen.getByLabelText('Seleccionar oficio'), { target: { value: 'o1' } }); fireEvent.click(screen.getByRole('button', { name: 'Agregar oficio' })); expect(screen.getAllByRole('button', { name: 'Quitar Plomero' })).toHaveLength(1) })
  it('permite guardar una lista vacía según el contrato', async () => { await mostrar(); fireEvent.click(screen.getByRole('button', { name: 'Quitar Plomero' })); fireEvent.click(screen.getByRole('button', { name: 'Guardar oficios' })); await screen.findByText('Oficios guardados en el servidor.'); expect(JSON.parse(http.mock.calls.find(([, c]) => c.method === 'PUT')[1].body)).toEqual({ oficioIds: [] }) })
  it('no confirma cambios rechazados por el backend', async () => { await mostrar(); http.mockResolvedValueOnce(respuesta({ error: 'Oficio desactivado' },400)); fireEvent.click(screen.getByRole('button', { name: 'Guardar oficios' })); expect(await screen.findByRole('alert')).toHaveTextContent('Oficio desactivado'); expect(screen.queryByText('Oficios guardados en el servidor.')).toBeNull() })
})
