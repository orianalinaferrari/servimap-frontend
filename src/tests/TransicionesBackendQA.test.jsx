import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom/vitest'
import SolicitudesPrestador from '../pages/SolicitudesPrestador'
import SolicitudesCliente from '../pages/SolicitudesCliente'
import { guardarToken } from '../services/sesionToken'
import { BASE, instalarHttp, respuesta, jwtPrueba } from './helpers/contratos'
let solicitud, http, token
const solicitudId = '4db83729-75bc-48fe-88f3-a957aa7a181d'
const clienteId = '995af8a7-7986-4f21-bdda-c65b67144d67'
const prestadorId = 'b33a32c0-a409-4243-9cf7-b3c7d07e4a97'
beforeEach(() => {
  vi.stubEnv('VITE_API_URL', BASE)
  token = jwtPrueba(); guardarToken(token)
  solicitud = { id: solicitudId, clienteId, prestadorId, oficioId: 'o1', descripcion: 'Trabajo de prueba', estado: 'PENDIENTE', fechaCreacion: '2026-10-29', oficio: { id: 'o1', nombre: 'Plomero' }, prestador: { id: prestadorId, nombre: 'Prestador' }, cliente: { id: clienteId, nombre: 'Cliente' }, calificada: false }
  http = instalarHttp((url, config) => {
    expect(config.headers.Authorization).toBe(`Bearer ${token}`)
    expect(config.credentials).toBe('omit')
    if (config.method === 'PATCH') {
      const accion = url.pathname.split('/').at(-1)
      solicitud = { ...solicitud, estado: { aceptar: 'ACEPTADA', finalizar: 'FINALIZADA', rechazar: 'RECHAZADA', cancelar: 'CANCELADA' }[accion] }
      return respuesta(solicitud)
    }
    expect(url.pathname).toBe('/api/solicitudes')
    return respuesta([solicitud])
  })
})
afterEach(() => { cleanup(); vi.unstubAllEnvs() })

describe('Transiciones desde componentes con HTTP simulado', () => {
  it.each([['cliente', SolicitudesCliente], ['prestador', SolicitudesPrestador]])('muestra el UUID completo como ID y abre/cierra su detalle para %s', async (_, Pagina) => {
    render(<MemoryRouter><Pagina /></MemoryRouter>)
    const etiqueta = await screen.findByText('ID de solicitud:')
    expect(etiqueta.parentElement).toHaveTextContent(`ID de solicitud: ${solicitudId}`)
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle' }))
    expect(screen.getByRole('heading', { name: `Detalle de solicitud · ID: ${solicitudId}` })).toBeInTheDocument()
    expect(screen.getByText('Trabajo de prueba')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar detalle' }))
    expect(screen.queryByRole('heading', { name: `Detalle de solicitud · ID: ${solicitudId}` })).toBeNull()
    expect(solicitud).toMatchObject({ id: solicitudId, clienteId, cliente: { id: clienteId }, prestadorId, prestador: { id: prestadorId }, oficioId: 'o1' })
    expect(http.mock.calls.every(([, config]) => config.method !== 'PATCH')).toBe(true)
  })
  it('confirma PENDIENTE → ACEPTADA → FINALIZADA recargando el estado real', async () => {
    render(<MemoryRouter><SolicitudesPrestador /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Aceptar solicitud' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar aceptación' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Marcar trabajo como terminado' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar trabajo terminado' }))
    await waitFor(() => expect(screen.getByText('Finalizada')).toBeInTheDocument())
    expect(http.mock.calls.filter(([, config]) => config.method === 'PATCH').map(([url]) => new URL(url).pathname)).toEqual([`/api/solicitudes/${solicitudId}/aceptar`, `/api/solicitudes/${solicitudId}/finalizar`])
    expect(solicitud).toMatchObject({ id: solicitudId, clienteId, prestadorId, oficioId: 'o1' })
    expect(screen.queryByRole('button', { name: 'Aceptar solicitud' })).toBeNull()
    expect(screen.queryByText(/pendiente de confirmación/i)).toBeNull()
  })
  it('confirma el rechazo sin permitir finalizar', async () => {
    render(<MemoryRouter><SolicitudesPrestador /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Rechazar solicitud' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar rechazo' }))
    await waitFor(() => expect(screen.getByText('Rechazada')).toBeInTheDocument())
    expect(http.mock.calls.filter(([, config]) => config.method === 'PATCH').map(([url]) => new URL(url).pathname)).toEqual([`/api/solicitudes/${solicitudId}/rechazar`])
    expect(screen.queryByRole('button', { name: 'Marcar trabajo como terminado' })).toBeNull()
  })
  it('permite al cliente cancelar una ACEPTADA solo tras confirmar', async () => {
    solicitud.estado = 'ACEPTADA'
    render(<MemoryRouter><SolicitudesCliente /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Preparar cancelación' }))
    expect(http.mock.calls.filter(([, config]) => config.method === 'PATCH')).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cancelación' }))
    await waitFor(() => expect(screen.getByText('Cancelada')).toBeInTheDocument())
    expect(http.mock.calls.filter(([, config]) => config.method === 'PATCH').map(([url]) => new URL(url).pathname)).toEqual([`/api/solicitudes/${solicitudId}/cancelar`])
    expect(solicitud).toMatchObject({ id: solicitudId, clienteId, prestadorId, oficioId: 'o1' })
    expect(screen.queryByRole('button', { name: 'Preparar cancelación' })).toBeNull()
  })
  it.each([403, 409])('rechazo HTTP %s conserva el estado previo y muestra el error', async (status) => {
    const original = http.getMockImplementation()
    http.mockImplementation((url, config) => config.method === 'PATCH' ? respuesta({ error: 'Operación rechazada por el servidor' }, status) : original(url, config))
    render(<MemoryRouter><SolicitudesPrestador /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Aceptar solicitud' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar aceptación' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Operación rechazada')
    expect(screen.queryByText('Aceptada')).toBeNull()
    expect(solicitud.estado).toBe('PENDIENTE')
  })
})
