import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'
import PanelPrestador from '../pages/PanelPrestador'
import SolicitudesPrestador from '../pages/SolicitudesPrestador'
import SolicitudesCliente from '../pages/SolicitudesCliente'
import { obtenerSolicitudesPrestador, aceptarSolicitudPrestador } from '../services/solicitudesPrestadorService'
import { obtenerSolicitudesCliente } from '../services/solicitudesClienteService'

const { auth } = vi.hoisted(() => ({ auth: { usuario: null } }))
vi.mock('../context/useAuth', () => ({ useAuth: () => auth }))
vi.mock('../services/solicitudesPrestadorService', () => ({ obtenerSolicitudesPrestador: vi.fn(), aceptarSolicitudPrestador: vi.fn(), rechazarSolicitudPrestador: vi.fn(), marcarTrabajoTerminadoPrestador: vi.fn() }))
vi.mock('../services/solicitudesClienteService', () => ({ obtenerSolicitudesCliente: vi.fn(), cancelarSolicitudCliente: vi.fn() }))
afterEach(() => { cleanup(); vi.resetAllMocks(); auth.usuario = null })

const mostrar = (Pagina) => render(<MemoryRouter><Pagina /></MemoryRouter>)

describe('Panel del prestador con datos incompletos', () => {
  it('usa textos de respaldo para nombre, servicio e identificador', async () => {
    auth.usuario = { rol: 'PRESTADOR', nombre: '   ' }
    vi.mocked(obtenerSolicitudesPrestador).mockResolvedValue([
      { id: 1, estado: 'PENDIENTE', servicio: { nombre: 'Gasista' }, fechaCreacion: '2026-10-03' },
      { id: 2, estado: 'ACEPTADA', servicio: '', fechaCreacion: '2026-10-02' },
      { estado: 'FINALIZADA', fechaCreacion: '2026-10-01' },
    ])
    mostrar(PanelPrestador)
    expect(await screen.findByText('Gasista')).toBeInTheDocument()
    expect(screen.getByText(/Hola, Prestador\./)).toBeInTheDocument()
    expect(screen.getAllByText('Servicio sin especificar')).toHaveLength(2)
    expect(screen.getByText('Solicitud #Sin número')).toBeInTheDocument()
  })
  it('informa el fallo al actualizar y no conserva actividad desactualizada', async () => {
    auth.usuario = { rol: 'PRESTADOR', nombre: 'María' }
    vi.mocked(obtenerSolicitudesPrestador).mockResolvedValueOnce([{ id: 7, estado: 'PENDIENTE', servicio: 'Plomería', fechaCreacion: '2026-10-03' }])
      .mockRejectedValueOnce(new Error('El servidor no respondió.'))
    mostrar(PanelPrestador)
    await screen.findByText('Plomería')
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }))
    expect(await screen.findByText('El servidor no respondió.')).toBeInTheDocument()
    expect(screen.queryByText('Plomería')).toBeNull()
  })
})

describe('Solicitudes recibidas con formatos alternativos', () => {
  it('muestra cliente en texto, cliente ausente y servicio como objeto', async () => {
    vi.mocked(obtenerSolicitudesPrestador).mockResolvedValue([
      { id: 31, estado: 'PENDIENTE', servicio: { descripcion: 'Arreglo de caldera' }, cliente: 'Lucía Díaz', fechaCreacion: '2026-10-02' },
      { id: 32, estado: 'PENDIENTE', servicio: 'Pintura', fechaCreacion: '2026-10-01' },
    ])
    mostrar(SolicitudesPrestador)
    expect(await screen.findByText('Lucía Díaz')).toBeInTheDocument()
    expect(screen.getByText('Cliente no informado')).toBeInTheDocument()
    const tarjeta = screen.getByText('Lucía Díaz').closest('article')
    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Ver detalle' }))
    expect(within(tarjeta).getByText('Servicio').nextElementSibling).toHaveTextContent('Arreglo de caldera')
  })
  it('conserva la confirmación del servidor aunque falle la recarga posterior', async () => {
    vi.mocked(obtenerSolicitudesPrestador).mockResolvedValueOnce([{ id: 41, estado: 'PENDIENTE', servicio: 'Plomería', cliente: { nombre: 'Ana' }, fechaCreacion: '2026-10-02' }])
      .mockRejectedValueOnce(new Error('No se pudo actualizar la lista.'))
    vi.mocked(aceptarSolicitudPrestador).mockResolvedValue({ id: 41, estado: 'ACEPTADA' })
    mostrar(SolicitudesPrestador)
    const tarjeta = (await screen.findByText('Ana')).closest('article')
    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Aceptar solicitud' }))
    fireEvent.click(within(tarjeta).getByRole('button', { name: 'Confirmar aceptación' }))
    expect(await screen.findByText('No se pudo actualizar la lista.')).toBeInTheDocument()
    expect(screen.getByText('La aceptación fue confirmada por el servidor.')).toBeInTheDocument()
  })
})

describe('Historial del cliente con formatos alternativos', () => {
  it('muestra el prestador en texto, en campo plano o ausente', async () => {
    vi.mocked(obtenerSolicitudesCliente).mockResolvedValue([
      { id: 51, estado: 'PENDIENTE', servicio: 'Plomería', prestador: 'QA Prestador texto', fechaCreacion: '2026-10-03' },
      { id: 52, estado: 'PENDIENTE', servicio: 'Gasista', nombrePrestador: 'QA Prestador plano', fechaCreacion: '2026-10-02' },
      { id: 53, estado: 'PENDIENTE', servicio: 'Pintura', fechaCreacion: '2026-10-01' },
    ])
    mostrar(SolicitudesCliente)
    expect(await screen.findByText('QA Prestador texto')).toBeInTheDocument()
    expect(screen.getByText('QA Prestador plano')).toBeInTheDocument()
    expect(screen.getByText('Prestador no informado')).toBeInTheDocument()
  })
})
