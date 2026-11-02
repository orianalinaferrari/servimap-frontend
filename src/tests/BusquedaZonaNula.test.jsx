import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import DirectorioPrestadores from '../components/DirectorioPrestadores'
import { filtrarPrestadores } from '../utils/filtrarPrestadores'
import { BASE, instalarHttp, respuesta } from './helpers/contratos'

vi.mock('../components/mapa/MapaPrestadores', () => ({
  MapaPrestadores: ({ prestadores, onSeleccionar }) => <section aria-label="Marcadores de prueba">{prestadores.map((p) => <button key={p.id} onClick={() => onSeleccionar(p.id)}>Marcador {p.id}</button>)}</section>,
}))
const oficio = { id: 'o1', nombre: 'Plomero' }
const sinZona = { id: 'p1', nombre: 'Ana Pérez', zonaCobertura: null, fotoPerfil: null, oficios: [oficio], precioMin: 100, precioMax: 200, disponible: true, reputacion: { promedio: 4.5, totalCalificaciones: 2, serviciosFinalizados: 1 } }
const conZona = { ...sinZona, id: 'p2', nombre: 'Bruno Díaz', zonaCobertura: 'Centro', disponible: false }
let http
beforeEach(() => {
  vi.stubEnv('VITE_API_URL', BASE)
  http = instalarHttp((url) => {
    if (url.pathname === '/api/oficios') return respuesta([oficio])
    if (url.pathname === '/api/prestadores/mapa') return respuesta([sinZona, conZona])
    if (url.pathname === '/api/prestadores/p1') return respuesta({ ...sinZona, comentarios: [] })
    if (url.pathname === '/api/prestadores') return respuesta(url.searchParams.get('q')?.includes('zzzz') ? [] : [sinZona, conZona])
  })
})
afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.useRealTimers() })
describe('Búsqueda con zona opcional del contrato público', () => {
  it.each([null, undefined])('permite buscar por oficio con zona %s y descartar sin coincidencias', (zonaCobertura) => {
    const prestador = { ...sinZona, zonaCobertura, oficios: ['Plomero'] }
    expect(filtrarPrestadores([prestador], 'plom')).toEqual([prestador])
    expect(filtrarPrestadores([prestador], 'zzzz')).toEqual([])
    expect(filtrarPrestadores([prestador], '')).toEqual([prestador])
    expect(filtrarPrestadores([prestador], 'PÉREZ')).toEqual([prestador])
  })
  it('no rompe el render al escribir, buscar sin resultados y limpiar', async () => {
    render(<DirectorioPrestadores />)
    await screen.findByRole('button', { name: sinZona.nombre })
    fireEvent.change(screen.getByLabelText('Buscar prestador'), { target: { value: 'plom' } })
    expect(screen.getByText('Mostrando 2 resultados')).toBeInTheDocument()
    await waitFor(() => expect(http.mock.calls.some(([url]) => new URL(url).searchParams.get('q') === 'plom')).toBe(true))
    fireEvent.change(screen.getByLabelText('Buscar prestador'), { target: { value: 'zzzz' } })
    await screen.findByText('No se encontraron prestadores con los criterios seleccionados.')
    expect(screen.getByLabelText('Buscar prestador')).toHaveValue('zzzz')
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(screen.getByText('Mostrando 2 resultados')).toBeInTheDocument()
  })
  it('combina filtros, mantiene las tarjetas y sincroniza marcadores al abrir la ficha', async () => {
    render(<DirectorioPrestadores />)
    await screen.findByRole('button', { name: sinZona.nombre })
    fireEvent.change(screen.getByLabelText('Buscar prestador'), { target: { value: 'PLÓM' } })
    fireEvent.change(screen.getByLabelText('Oficio'), { target: { value: 'Plomero' } })
    fireEvent.change(screen.getByLabelText('Precio máximo'), { target: { value: '150' } })
    fireEvent.change(screen.getByLabelText('Calificación mínima'), { target: { value: '4' } })
    fireEvent.click(screen.getByLabelText('Solo prestadores disponibles'))
    expect(screen.getByText('Mostrando 1 resultado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: sinZona.nombre })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Marcadores de prueba' })).getAllByRole('button')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Marcador p1' }))
    await screen.findByRole('heading', { name: sinZona.nombre })
    expect(screen.getByRole('button', { name: 'Solicitar servicio' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }))
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    fireEvent.change(screen.getByLabelText('Zona'), { target: { value: 'Centro' } })
    expect(screen.getByText('Mostrando 1 resultado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: conZona.nombre })).toBeInTheDocument()
  })
  it('ignora una respuesta antigua al cambiar rápidamente el texto', async () => {
    render(<DirectorioPrestadores />)
    await screen.findByRole('button', { name: sinZona.nombre })
    let resolverVieja
    http.mockImplementation((url) => {
      if (new URL(url).searchParams.get('q') === 'plom') return new Promise((resolve) => { resolverVieja = resolve })
      return Promise.resolve(respuesta([]))
    })
    fireEvent.change(screen.getByLabelText('Buscar prestador'), { target: { value: 'plom' } })
    await waitFor(() => expect(resolverVieja).toBeTypeOf('function'))
    fireEvent.change(screen.getByLabelText('Buscar prestador'), { target: { value: 'zzzz' } })
    await waitFor(() => expect(http.mock.calls.some(([url]) => new URL(url).searchParams.get('q') === 'zzzz')).toBe(true))
    await act(async () => { resolverVieja(respuesta([sinZona])) })
    expect(screen.getByText('Mostrando 0 resultados')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: sinZona.nombre })).toBeNull()
  })
})
