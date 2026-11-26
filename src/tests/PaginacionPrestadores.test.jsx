import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import DirectorioPrestadores from '../components/DirectorioPrestadores'
import { listarPrestadores, normalizarPaginaPrestadores } from '../services/prestadoresService'
import { BASE, instalarHttp, respuesta } from './helpers/contratos'

vi.mock('../components/mapa/MapaPrestadores', () => ({
  MapaPrestadores: ({ prestadores, onSeleccionar }) => <section aria-label="Mapa independiente">{prestadores.map(p => <button key={p.id} onClick={() => onSeleccionar(p.id)}>Marcador {p.id}</button>)}</section>,
}))
const oficio = { id: 'o1', nombre: 'Plomero' }
const registros = Array.from({ length: 51 }, (_, i) => ({ id: `p${i + 1}`, nombre: `Profesional ${String(i + 1).padStart(2, '0')}`, zonaCobertura: i % 2 ? 'Centro' : null, oficios: [oficio], precioMin: 100, disponible: true }))
function pagina(page = 1, lista = registros) {
  return { registros: lista.slice((page - 1) * 50, page * 50), totalRegistros: lista.length, pagina: page, limite: 50, totalPaginas: Math.ceil(lista.length / 50) }
}
let http
beforeEach(() => {
  vi.stubEnv('VITE_API_URL', BASE)
  http = instalarHttp(url => {
    if (url.pathname === '/api/oficios') return respuesta([oficio])
    if (url.pathname === '/api/prestadores/mapa') return respuesta([registros[0], registros[50]])
    if (url.pathname === '/api/prestadores/p51') return respuesta(registros[50])
    return respuesta(pagina(Number(url.searchParams.get('page') || 1)))
  })
})
afterEach(() => { cleanup(); vi.unstubAllEnvs() })
const peticiones = () => http.mock.calls.map(([url]) => new URL(url)).filter(url => url.pathname === '/api/prestadores')

describe('Normalización del contrato de prestadores', () => {
  it('distingue el array anterior sin inventar totales ni páginas', () => {
    const dato = normalizarPaginaPrestadores([registros[0]])
    expect(dato).toMatchObject({ paginada: false, pagina: null, limite: null, totalRegistros: null, totalPaginas: null })
    expect(dato.registros[0]).toMatchObject({ oficios: ['Plomero'], calificacionPromedio: null, zonaCobertura: null })
  })
  it.each([0, 1, 50, 51, 101])('conserva metadatos confirmados para %s registros', total => {
    const lista = Array.from({ length: total }, (_, i) => ({ ...registros[0], id: `id${i}` }))
    expect(normalizarPaginaPrestadores(pagina(1, lista))).toMatchObject({ paginada: true, totalRegistros: total, totalPaginas: Math.ceil(total / 50) })
  })
  it('acepta una página inexistente con sus totales y lista vacía', () => {
    expect(normalizarPaginaPrestadores(pagina(4))).toMatchObject({ registros: [], pagina: 4, totalRegistros: 51, totalPaginas: 2 })
  })
  it.each([null, {}, { registros: {} }, { ...pagina(), pagina: 0 }, { ...pagina(), limite: 51 }, { ...pagina(), totalRegistros: -1 }, { ...pagina(), totalPaginas: 10 }, { ...pagina(), registros: [null] }, [null], [{ ...registros[0], oficios: {} }], [{ ...registros[0], zonaCobertura: {} }], [{ ...registros[0], reputacion: { promedio: '5' } }]])('rechaza respuestas malformadas mediante Error: %j', dato => {
    expect(() => normalizarPaginaPrestadores(dato)).toThrow(Error)
  })
  it('admite opcionales ausentes y coordenadas inválidas sin inventar ubicación', () => {
    const dato = normalizarPaginaPrestadores([{ id: 'p1', nombre: 'Ana', latitud: 999, longitud: null }]).registros[0]
    expect(dato).toMatchObject({ oficios: [], comentarios: [], calificacionPromedio: null, latitud: 999, longitud: null })
  })
  it('envía page y limit con los filtros existentes y conserva HTTP 400', async () => {
    await listarPrestadores({ page: 2, q: 'Ana', oficioId: 'o1', disponible: true })
    expect(Object.fromEntries(peticiones()[0].searchParams)).toEqual({ page: '2', limit: '50', q: 'Ana', oficioId: 'o1', disponible: 'true' })
    http.mockResolvedValueOnce(respuesta({ error: 'Página inválida' }, 400))
    await expect(listarPrestadores({ page: 0 })).rejects.toMatchObject({ status: 400, message: 'Página inválida' })
  })
})

describe('Directorio paginado con HTTP simulado', () => {
  it.each([0, 1, 50])('presenta %s registros sin ofrecer una segunda página inexistente', async total => {
    const original = http.getMockImplementation()
    http.mockImplementation((url, config) => new URL(url).pathname === '/api/prestadores' ? Promise.resolve(respuesta(pagina(1, registros.slice(0, total)))) : original(url, config))
    render(<DirectorioPrestadores />)
    await screen.findByText(`Total informado por el servidor: ${total}.`)
    if (total === 0) {
      expect(screen.getByText('No hay páginas de resultados.')).toBeVisible()
      expect(screen.queryByRole('button', { name: 'Siguiente' })).toBeNull()
    } else {
      expect(screen.getByText('Página 1 de 1')).toBeVisible()
      expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    }
  })
  it('carga una sola vez, navega hasta la última página y conserva marcadores ajenos a ella', async () => {
    render(<DirectorioPrestadores />)
    await screen.findByText('Página 1 de 2')
    await act(async () => new Promise(resolve => setTimeout(resolve, 350)))
    expect(peticiones()).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    await screen.findByText('Página 2 de 2')
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Profesional 51' })).toBeVisible()
    expect(within(screen.getByRole('region', { name: 'Mapa independiente' })).getAllByRole('button')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Marcador p51' }))
    await screen.findByRole('heading', { name: 'Profesional 51' })
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }))
    expect(screen.getByText('Página 2 de 2')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    await screen.findByText('Página 1 de 2')
    const mapa = http.mock.calls.filter(([url]) => new URL(url).pathname.endsWith('/mapa'))
    expect(mapa).toHaveLength(1)
    expect(new URL(mapa[0][0]).search).toBe('')
  })
  it('distingue filtros locales, conserva total remoto y reinicia la página', async () => {
    render(<DirectorioPrestadores />)
    await screen.findByText('Página 1 de 2')
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    await screen.findByText('Página 2 de 2')
    fireEvent.change(screen.getByLabelText('Precio máximo'), { target: { value: '10' } })
    await screen.findByText('Página 1 de 2')
    expect(screen.getByText('Total informado por el servidor: 51 (sin aplicar zona ni precio máximo).')).toBeVisible()
    expect(screen.getByText('No hay coincidencias en esta página. Puede haber resultados en otras páginas.')).toBeVisible()
    expect(peticiones().every(url => !url.searchParams.has('precioMax') && !url.searchParams.has('zona'))).toBe(true)
    expect(screen.getByText(/Por ahora no refleja los filtros del listado/)).toBeVisible()
  })
  it('reinicia en 1 al buscar y descarta una respuesta de búsqueda anterior', async () => {
    render(<DirectorioPrestadores />)
    await screen.findByText('Página 1 de 2')
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    await screen.findByText('Página 2 de 2')
    let resolver
    http.mockImplementation(url => {
      const consulta = new URL(url)
      if (consulta.searchParams.get('q') === 'vieja') return new Promise(resolve => { resolver = resolve })
      return Promise.resolve(respuesta(pagina(1, [])))
    })
    fireEvent.change(screen.getByLabelText('Buscar prestador'), { target: { value: 'vieja' } })
    await waitFor(() => expect(resolver).toBeTypeOf('function'))
    fireEvent.change(screen.getByLabelText('Buscar prestador'), { target: { value: 'nueva' } })
    await screen.findByText('No hay páginas de resultados.')
    await act(async () => resolver(respuesta(pagina())))
    expect(screen.getByText('No hay páginas de resultados.')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Profesional 01' })).toBeNull()
    expect(peticiones().filter(url => url.searchParams.get('q')).every(url => url.searchParams.get('page') === '1')).toBe(true)
  })
  it.each(['Oficio', 'Zona', 'Calificación mínima', 'Solo prestadores disponibles'])('reinicia en 1 al cambiar %s', async etiqueta => {
    render(<DirectorioPrestadores />)
    await screen.findByText('Página 1 de 2')
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    await screen.findByText('Página 2 de 2')
    const valores = { Oficio: 'Plomero', Zona: 'Centro', 'Calificación mínima': '4' }
    if (etiqueta === 'Solo prestadores disponibles') fireEvent.click(screen.getByLabelText(etiqueta))
    else fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valores[etiqueta] } })
    await screen.findByText('Página 1 de 2')
    expect(peticiones().at(-1).searchParams.get('page')).toBe('1')
  })
  it('limpiar mientras hay una petición pendiente restaura la página inicial sin quedar cargando', async () => {
    render(<DirectorioPrestadores />)
    await screen.findByText('Página 1 de 2')
    let resolver
    http.mockImplementation(() => new Promise(resolve => { resolver = resolve }))
    fireEvent.change(screen.getByLabelText('Buscar prestador'), { target: { value: 'pendiente' } })
    await waitFor(() => expect(resolver).toBeTypeOf('function'))
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(screen.getByText('Página 1 de 2')).toBeVisible()
    expect(screen.queryByText('Actualizando búsqueda...')).toBeNull()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled()
    await act(async () => resolver(respuesta(pagina(1, []))))
    expect(screen.getByRole('button', { name: 'Profesional 01' })).toBeVisible()
    expect(peticiones()).toHaveLength(2)
  })
  it('controla un error de red al buscar y permite reintentar', async () => {
    render(<DirectorioPrestadores />)
    await screen.findByText('Página 1 de 2')
    http.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    fireEvent.change(screen.getByLabelText('Buscar prestador'), { target: { value: 'nuevo' } })
    await screen.findByText('No se pudo conectar con el servidor.')
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar búsqueda' }))
    await screen.findByText('Página 1 de 2')
    expect(screen.getByRole('button', { name: 'Profesional 01' })).toBeVisible()
  })
  it('agrupa cambios rápidos con debounce y descarta una página anterior pendiente', async () => {
    render(<DirectorioPrestadores />)
    await screen.findByText('Página 1 de 2')
    let resolverPagina
    http.mockImplementation(url => new URL(url).searchParams.get('page') === '2'
      ? new Promise(resolve => { resolverPagina = resolve })
      : Promise.resolve(respuesta(pagina(1, []))))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    await waitFor(() => expect(resolverPagina).toBeTypeOf('function'))
    for (const value of ['A', 'An', 'Ana']) fireEvent.change(screen.getByLabelText('Buscar prestador'), { target: { value } })
    await screen.findByText('No hay páginas de resultados.')
    await act(async () => resolverPagina(respuesta(pagina(2))))
    expect(screen.queryByRole('button', { name: 'Profesional 51' })).toBeNull()
    expect(peticiones().filter(url => url.searchParams.get('q')).map(url => url.searchParams.get('q'))).toEqual(['Ana'])
  })
  it('renderiza perfiles sin zona, foto, reputación, oficios o ubicación válida', async () => {
    const original = http.getMockImplementation()
    const opcionales = [{ id: 'opcional', nombre: 'Sin datos opcionales', latitud: 999, longitud: null }]
    http.mockImplementation((url, config) => new URL(url).pathname === '/api/prestadores' ? Promise.resolve(respuesta(pagina(1, opcionales))) : original(url, config))
    render(<DirectorioPrestadores />)
    await screen.findByRole('button', { name: 'Sin datos opcionales' })
    expect(screen.getByText('Página 1 de 1')).toBeVisible()
    expect(screen.queryByRole('alert')).toBeNull()
  })
  it('permite recuperarse de una página que dejó de existir sin recorrer otras páginas automáticamente', async () => {
    render(<DirectorioPrestadores />)
    await screen.findByText('Página 1 de 2')
    http.mockResolvedValueOnce(respuesta(pagina(2, registros.slice(0, 1))))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    await screen.findByText('Página 2 de 1 (fuera de rango)')
    expect(peticiones()).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Volver a la primera página' }))
    await screen.findByText('Página 1 de 2')
  })
  it.each([400, 500])('muestra HTTP %s y reintenta la misma página', async status => {
    render(<DirectorioPrestadores />)
    await screen.findByText('Página 1 de 2')
    http.mockResolvedValueOnce(respuesta({ error: 'Error de página' }, status))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    await screen.findByText('Error de página')
    expect(screen.queryByRole('button', { name: 'Profesional 01' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar búsqueda' }))
    await screen.findByText('Página 2 de 2')
  })
  it('no anuncia totales ni controles remotos para el array anterior', async () => {
    const original = http.getMockImplementation()
    http.mockImplementation((url, config) => new URL(url).pathname === '/api/prestadores' ? Promise.resolve(respuesta([registros[0]])) : original(url, config))
    render(<DirectorioPrestadores />)
    await screen.findByRole('button', { name: 'Profesional 01' })
    expect(screen.getByText(/el total global no está disponible/)).toBeVisible()
    expect(screen.queryByRole('navigation', { name: 'Paginación de prestadores' })).toBeNull()
    expect(screen.queryByText(/Total informado/)).toBeNull()
  })
  it('captura un contrato malformado en la carga inicial y permite reintentar', async () => {
    const original = http.getMockImplementation()
    let fallo = true
    http.mockImplementation((url, config) => new URL(url).pathname === '/api/prestadores' && fallo ? Promise.resolve(respuesta({ registros: null })) : original(url, config))
    render(<DirectorioPrestadores />)
    await screen.findByText('El servidor devolvió una paginación de prestadores no válida.')
    fallo = false
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar búsqueda' }))
    await screen.findByText('Página 1 de 2')
  })
  it('aísla un mapa malformado sin impedir la paginación del directorio', async () => {
    const original = http.getMockImplementation()
    http.mockImplementation((url, config) => new URL(url).pathname.endsWith('/mapa') ? Promise.resolve(respuesta([{ id: 'p1', nombre: {} }])) : original(url, config))
    render(<DirectorioPrestadores />)
    await screen.findByText('Página 1 de 2')
    expect(screen.getByRole('alert')).toHaveTextContent('ubicaciones públicas no válidas')
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    await screen.findByText('Página 2 de 2')
  })
})
