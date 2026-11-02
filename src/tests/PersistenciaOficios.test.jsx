import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import OficiosPrestador from '../pages/OficiosPrestador'
import { BASE, instalarHttp, perfilPrueba, respuesta, jwtPrueba } from './helpers/contratos'
import { guardarToken } from '../services/sesionToken'

const catalogo = [{ id: 'gas', nombre: 'Gasista' }, { id: 'elec', nombre: 'Electricista' }]
let persistido, http
beforeEach(() => {
  vi.stubEnv('VITE_API_URL', BASE)
  guardarToken(jwtPrueba())
  persistido = { ...perfilPrueba, oficios: [] }
  http = instalarHttp((url, config) => {
    if (url.pathname === '/api/oficios') return respuesta(catalogo)
    if (config.method === 'PUT') persistido = { ...persistido, oficios: JSON.parse(config.body).oficioIds.map((id) => catalogo.find((item) => item.id === id)) }
    return respuesta(persistido)
  })
})
afterEach(() => { cleanup(); vi.unstubAllEnvs() })
async function mostrar() { const resultado = render(<OficiosPrestador />); await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar oficios' })).toBeEnabled()); return resultado }
function agregar(id) { fireEvent.change(screen.getByLabelText('Seleccionar oficio'), { target: { value: id } }); fireEvent.click(screen.getByRole('button', { name: 'Agregar oficio' })) }
function guardar() { fireEvent.click(screen.getByRole('button', { name: 'Guardar oficios' })) }
describe('Persistencia de oficios confirmada por PUT y GET', () => {
  it.each([['gas'], ['gas', 'elec']])('guarda y recupera %j tras desmontar y restablecer la sesión', async (...ids) => {
    const { unmount } = await mostrar()
    ids.forEach(agregar); guardar()
    await screen.findByText('Oficios guardados en el servidor.')
    const [url, config] = http.mock.calls.find(([, c]) => c.method === 'PUT')
    expect(url).toBe(BASE + '/api/prestadores/me/oficios')
    expect(JSON.parse(config.body)).toEqual({ oficioIds: ids })
    expect(config.headers.Authorization).toMatch(/^Bearer /)
    expect(http.mock.calls.at(-1)[1]).toMatchObject({ cache: 'no-store', headers: { Authorization: config.headers.Authorization } })
    unmount(); sessionStorage.clear(); guardarToken(jwtPrueba())
    await mostrar()
    for (const id of ids) expect(screen.getByRole('button', { name: `Quitar ${catalogo.find((item) => item.id === id).nombre}` })).toBeEnabled()
  })
  it.each([400, 401, 500])('no confirma HTTP %s y conserva la selección', async (status) => {
    await mostrar(); agregar('gas')
    http.mockResolvedValueOnce(respuesta({ error: 'Guardado rechazado' }, status)); guardar()
    expect(await screen.findByRole('alert')).toHaveTextContent('Guardado rechazado')
    expect(screen.queryByText('Oficios guardados en el servidor.')).toBeNull()
    expect(screen.getByRole('button', { name: 'Quitar Gasista' })).toBeEnabled()
  })
  it.each([null, {}, { ...perfilPrueba, oficios: [] }, { ...perfilPrueba, oficios: [catalogo[1]] }])('no trata un PUT inconsistente como confirmación', async (devuelto) => {
    await mostrar(); agregar('gas'); http.mockResolvedValueOnce(respuesta(devuelto)); guardar()
    expect(await screen.findByRole('alert')).toHaveTextContent('no confirmó')
    expect(screen.queryByText('Oficios guardados en el servidor.')).toBeNull()
    expect(screen.getByRole('button', { name: 'Quitar Gasista' })).toBeEnabled()
  })
  it('detecta PUT correcto seguido de GET vacío sin pisar la selección', async () => {
    await mostrar(); agregar('gas')
    http.mockResolvedValueOnce(respuesta({ ...persistido, oficios: [catalogo[0]] }))
    http.mockResolvedValueOnce(respuesta(persistido)); guardar()
    expect(await screen.findByRole('alert')).toHaveTextContent('no coinciden')
    expect(screen.queryByText('Oficios guardados en el servidor.')).toBeNull()
    expect(screen.getByRole('button', { name: 'Quitar Gasista' })).toBeEnabled()
  })
  it('rechaza un GET de verificación fallido y mantiene selección', async () => {
    await mostrar(); agregar('gas')
    http.mockResolvedValueOnce(respuesta({ ...persistido, oficios: [catalogo[0]] }))
    http.mockResolvedValueOnce(respuesta({ error: 'Consulta fallida' }, 500)); guardar()
    expect(await screen.findByRole('alert')).toHaveTextContent('Consulta fallida')
    expect(screen.queryByText('Oficios guardados en el servidor.')).toBeNull()
    expect(screen.getByRole('button', { name: 'Quitar Gasista' })).toBeEnabled()
  })
  it('ignora una consulta antigua de una instancia desmontada', async () => {
    let resolver
    http.mockImplementationOnce(async () => respuesta(catalogo))
    http.mockImplementationOnce(() => new Promise((resolve) => { resolver = resolve }))
    const vieja = render(<OficiosPrestador />)
    await waitFor(() => expect(resolver).toBeTypeOf('function')); vieja.unmount()
    await mostrar(); agregar('gas')
    await act(async () => { resolver(respuesta({ ...persistido, oficios: [] })) })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Quitar Gasista' })).toBeEnabled())
  })
})
