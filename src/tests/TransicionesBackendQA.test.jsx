import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom/vitest'
import SolicitudesPrestador from '../pages/SolicitudesPrestador'
import SolicitudesCliente from '../pages/SolicitudesCliente'
import { guardarToken } from '../services/sesionToken'
import { BASE, instalarHttp, respuesta, jwtPrueba } from './helpers/contratos'
let solicitud, http, token
beforeEach(() => {
  vi.stubEnv('VITE_API_URL', BASE)
  token = jwtPrueba(); guardarToken(token)
  solicitud = { id: 's1', descripcion: 'Trabajo de prueba', estado: 'PENDIENTE', fechaCreacion: '2026-10-29', oficio: { id: 'o1', nombre: 'Plomero' }, prestador: { id: 'p1', nombre: 'Prestador' }, cliente: { id: 'u1', nombre: 'Cliente' }, calificada: false }
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
  it('confirma PENDIENTE → ACEPTADA → FINALIZADA recargando el estado real', async () => {
    render(<MemoryRouter><SolicitudesPrestador /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Aceptar solicitud' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar aceptación' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Marcar trabajo como terminado' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar trabajo terminado' }))
    await waitFor(() => expect(screen.getByText('Finalizada')).toBeInTheDocument())
    expect(http.mock.calls.filter(([, config]) => config.method === 'PATCH').map(([url]) => new URL(url).pathname)).toEqual(['/api/solicitudes/s1/aceptar','/api/solicitudes/s1/finalizar'])
    expect(screen.queryByRole('button', { name: 'Aceptar solicitud' })).toBeNull()
    expect(screen.queryByText(/pendiente de confirmación/i)).toBeNull()
  })
  it('confirma el rechazo sin permitir finalizar', async () => {
    render(<MemoryRouter><SolicitudesPrestador /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Rechazar solicitud' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar rechazo' }))
    await waitFor(() => expect(screen.getByText('Rechazada')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Marcar trabajo como terminado' })).toBeNull()
  })
  it('permite al cliente cancelar una ACEPTADA solo tras confirmar', async () => {
    solicitud.estado = 'ACEPTADA'
    render(<MemoryRouter><SolicitudesCliente /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Preparar cancelación' }))
    expect(http.mock.calls.filter(([, config]) => config.method === 'PATCH')).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cancelación' }))
    await waitFor(() => expect(screen.getByText('Cancelada')).toBeInTheDocument())
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
