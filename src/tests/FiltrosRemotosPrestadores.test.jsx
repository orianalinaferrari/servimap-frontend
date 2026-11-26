import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import DirectorioPrestadores from '../components/DirectorioPrestadores'
import { listarPrestadores } from '../services/prestadoresService'
import { filtrosRemotosPrestadoresHabilitados, prepararFiltrosRemotos } from '../services/filtrosRemotosPrestadores'
import { BASE, instalarHttp, respuesta } from './helpers/contratos'

vi.mock('../components/mapa/MapaPrestadores', () => ({
  MapaPrestadores: ({ prestadores }) => <section aria-label="Mapa independiente">{prestadores.map(p => <span key={p.id}>Marcador {p.id}</span>)}</section>,
}))
const oficio = { id: 'o1', nombre: 'Plomería' }
const registros = Array.from({ length: 102 }, (_, i) => ({
  id: `p${i}`, nombre: `Profesional ${String(i).padStart(3, '0')}`,
  zonaCobertura: i < 50 ? 'Centro' : 'Norte', precioMin: i === 101 ? null : i === 50 ? 0 : 100,
  oficios: [oficio], fotoPerfil: null, disponible: true,
}))
function paginar(lista, page = 1) {
  return { registros: lista.slice((page - 1) * 50, page * 50), totalRegistros: lista.length, pagina: page, limite: 50, totalPaginas: Math.ceil(lista.length / 50) }
}
// Servidor simulado: filtra antes de paginar. No llama al backend publicado.
function listado(url) {
  const zona = url.searchParams.get('zona')
  const presupuesto = url.searchParams.get('presupuesto')
  const lista = registros.filter(p => (!zona || p.zonaCobertura?.toLowerCase() === zona.toLowerCase()) &&
    (presupuesto === null || p.precioMin !== null && p.precioMin <= Number(presupuesto)))
  return respuesta(paginar(lista, Number(url.searchParams.get('page') || 1)))
}
function activar() {
  vi.stubEnv('VITE_PRESTADORES_CONTRATO_FILTROS', 'zona-presupuesto-v1')
  vi.stubEnv('VITE_PRESTADORES_FILTROS_API_ORIGIN', BASE)
}
let http
beforeEach(() => {
  vi.stubEnv('VITE_API_URL', BASE)
  vi.stubEnv('VITE_PRESTADORES_CONTRATO_FILTROS', '')
  vi.stubEnv('VITE_PRESTADORES_FILTROS_API_ORIGIN', '')
  http = instalarHttp(url => {
    if (url.pathname === '/api/oficios') return respuesta([oficio])
    if (url.pathname === '/api/prestadores/mapa') return respuesta([registros[0], registros[101]])
    return listado(url)
  })
})
afterEach(() => { cleanup(); vi.unstubAllEnvs() })
const solicitudes = () => http.mock.calls.map(([url]) => new URL(url)).filter(url => url.pathname === '/api/prestadores')

describe('Activación explícita del contrato #57', () => {
  it('mantiene modo local por defecto aunque la API ya esté paginada', async () => {
    expect(filtrosRemotosPrestadoresHabilitados()).toBe(false)
    expect(await listarPrestadores()).toMatchObject({ paginada: true, filtrosRemotos: false, totalRegistros: 102 })
    await expect(listarPrestadores({ zona: 'Norte' })).rejects.toThrow('todavía no está habilitado')
    expect(solicitudes()).toHaveLength(1)
  })
  it.each([
    ['zona-presupuesto-v1', ''], ['', BASE], ['true', BASE], ['zona-presupuesto-v1', 'https://otra-api.example.test'],
  ])('rechaza activación incompleta o ajena al origen: %s / %s', async (contrato, origen) => {
    vi.stubEnv('VITE_PRESTADORES_CONTRATO_FILTROS', contrato)
    vi.stubEnv('VITE_PRESTADORES_FILTROS_API_ORIGIN', origen)
    await expect(listarPrestadores()).rejects.toThrow('no coincide')
    expect(http).not.toHaveBeenCalled()
  })
  it('requiere declaración de versión y origen exactos y conserva presupuesto cero', async () => {
    activar()
    expect(filtrosRemotosPrestadoresHabilitados()).toBe(true)
    const pagina = await listarPrestadores({ zona: ' nOrTe ', presupuesto: 0 })
    expect(pagina).toMatchObject({ filtrosRemotos: true, totalRegistros: 1, totalPaginas: 1 })
    expect(pagina.registros[0].id).toBe('p50')
    expect(Object.fromEntries(solicitudes()[0].searchParams)).toEqual({ page: '1', limit: '50', zona: 'nOrTe', presupuesto: '0' })
  })
  it('no degrada silenciosamente a array cuando se declaró activo el contrato completo', async () => {
    activar()
    http.mockResolvedValueOnce(respuesta([registros[0]]))
    await expect(listarPrestadores()).rejects.toThrow('contrato anterior')
  })
  it('mantiene compatibilidad antigua sin inventar totales cuando no se activa', async () => {
    http.mockResolvedValueOnce(respuesta([registros[0]]))
    expect(await listarPrestadores()).toMatchObject({ filtrosRemotos: false, paginada: false, totalRegistros: null, totalPaginas: null })
  })
  it.each([-1, Infinity, NaN, 'abc', false, {}])('rechaza presupuesto inválido %j sin hacer HTTP', async presupuesto => {
    activar()
    await expect(listarPrestadores({ presupuesto })).rejects.toThrow('número finito')
    expect(http).not.toHaveBeenCalled()
  })
  it('valida longitud de zona y omite filtros vacíos en lugar de enviarlos', async () => {
    activar()
    await expect(listarPrestadores({ zona: 'x'.repeat(101) })).rejects.toThrow('100 caracteres')
    await listarPrestadores({ zona: '  ', presupuesto: '' })
    expect(Object.fromEntries(solicitudes()[0].searchParams)).toEqual({ page: '1', limit: '50' })
    expect(prepararFiltrosRemotos({ zona: 12 }).errores.zona).toBeDefined()
    expect(prepararFiltrosRemotos({ zona: 'x'.repeat(100), presupuesto: ' 10.5 ' }).parametros).toEqual({ zona: 'x'.repeat(100), presupuesto: 10.5 })
  })
})

describe('Listado con filtros remotos y compatibilidad', () => {
  it('encuentra una zona fuera de las sugerencias de la primera página y usa totales globales filtrados', async () => {
    activar()
    render(<DirectorioPrestadores />)
    await screen.findByText('Página 1 de 3')
    const zona = screen.getByLabelText('Zona')
    expect(zona.tagName).toBe('INPUT')
    expect(screen.getByText(/Las sugerencias son parciales/)).toBeVisible()
    fireEvent.change(zona, { target: { value: ' nOrTe ' } })
    fireEvent.change(screen.getByLabelText('Precio máximo'), { target: { value: '100' } })
    await screen.findByText('Página 1 de 2')
    expect(screen.getByText('Total informado por el servidor: 51.')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Profesional 050' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Profesional 101' })).toBeNull()
    expect(screen.getByText('Mostrando 50 resultados')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    await screen.findByText('Página 2 de 2')
    expect(screen.getByRole('button', { name: 'Profesional 100' })).toBeVisible()
    expect(solicitudes().at(-1).searchParams.get('zona')).toBe('nOrTe')
    expect(solicitudes().at(-1).searchParams.get('presupuesto')).toBe('100')
    expect(within(screen.getByRole('region', { name: 'Mapa independiente' })).getAllByText(/Marcador/)).toHaveLength(2)
    const mapas = http.mock.calls.filter(([url]) => new URL(url).pathname.endsWith('/mapa'))
    expect(mapas).toHaveLength(1)
    expect(new URL(mapas[0][0]).search).toBe('')
  })
  it('reinicia en 1, admite cero y vacío y no inventa coincidencias de zona', async () => {
    activar()
    render(<DirectorioPrestadores />)
    await screen.findByText('Página 1 de 3')
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    await screen.findByText('Página 2 de 3')
    fireEvent.change(screen.getByLabelText('Precio máximo'), { target: { value: '0' } })
    await screen.findByText('Página 1 de 1')
    expect(screen.getByText('Total informado por el servidor: 1.')).toBeVisible()
    expect(solicitudes().at(-1).searchParams.get('page')).toBe('1')
    fireEvent.change(screen.getByLabelText('Precio máximo'), { target: { value: '' } })
    await screen.findByText('Página 1 de 3')
    expect(solicitudes().at(-1).searchParams.has('presupuesto')).toBe(false)
    fireEvent.change(screen.getByLabelText('Zona'), { target: { value: 'Sin coincidencias' } })
    await screen.findByText('No hay páginas de resultados.')
    expect(screen.getByText('Total informado por el servidor: 0.')).toBeVisible()
    expect(screen.getByText('No se encontraron prestadores para los filtros enviados al servidor.')).toBeVisible()
  })
  it.each(['-1', 'Infinity', 'abc'])('muestra presupuesto inválido %s sin pedir datos ni presentar totales', async value => {
    activar()
    render(<DirectorioPrestadores />)
    await screen.findByText('Página 1 de 3')
    fireEvent.change(screen.getByLabelText('Precio máximo'), { target: { value } })
    expect(screen.getByRole('alert')).toHaveTextContent('número finito')
    expect(screen.queryByText(/Total informado/)).toBeNull()
    await act(async () => new Promise(resolve => setTimeout(resolve, 350)))
    expect(solicitudes()).toHaveLength(1)
  })
  it('descarta respuestas de filtros anteriores que llegan tarde', async () => {
    activar()
    render(<DirectorioPrestadores />)
    await screen.findByText('Página 1 de 3')
    let resolver
    http.mockImplementation(url => new URL(url).searchParams.get('zona') === 'Norte'
      ? new Promise(resolve => { resolver = resolve })
      : Promise.resolve(respuesta(paginar([]))))
    fireEvent.change(screen.getByLabelText('Zona'), { target: { value: 'Norte' } })
    await waitFor(() => expect(resolver).toBeTypeOf('function'))
    fireEvent.change(screen.getByLabelText('Zona'), { target: { value: 'Otra' } })
    await screen.findByText('Total informado por el servidor: 0.')
    await act(async () => resolver(respuesta(paginar(registros.slice(50)))))
    expect(screen.getByText('Total informado por el servidor: 0.')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Profesional 050' })).toBeNull()
  })
  it.each([400, 500])('muestra HTTP %s y reintenta con los mismos filtros', async status => {
    activar()
    render(<DirectorioPrestadores />)
    await screen.findByText('Página 1 de 3')
    http.mockResolvedValueOnce(respuesta({ error: 'Filtro rechazado por backend' }, status))
    fireEvent.change(screen.getByLabelText('Zona'), { target: { value: 'Norte' } })
    expect(await screen.findByRole('alert')).toHaveTextContent('Filtro rechazado por backend')
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar búsqueda' }))
    await screen.findByText('Total informado por el servidor: 52.')
    expect(solicitudes().at(-1).searchParams.get('zona')).toBe('Norte')
  })
  it('no envía filtros nuevos a un backend solo paginado y conserva la aclaración local', async () => {
    render(<DirectorioPrestadores />)
    await screen.findByText('Página 1 de 3')
    expect(screen.getByLabelText('Zona').tagName).toBe('SELECT')
    fireEvent.change(screen.getByLabelText('Precio máximo'), { target: { value: '0' } })
    expect(screen.getByText(/sin aplicar zona ni precio máximo/)).toBeVisible()
    expect(screen.getByText(/Puede haber resultados en otras páginas/)).toBeVisible()
    expect(solicitudes().every(url => !url.searchParams.has('zona') && !url.searchParams.has('presupuesto'))).toBe(true)
  })
})
