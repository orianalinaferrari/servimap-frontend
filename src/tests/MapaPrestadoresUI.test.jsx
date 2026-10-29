import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MapaPrestadores } from '../components/mapa/MapaPrestadores'
import { cargarMapLibre } from '../components/mapa/cargarMapLibre'
import { BuscadorPrestadores } from '../components/BuscadorPrestadores'
import { BASE, respuesta } from './helpers/contratos'

vi.mock('../components/mapa/cargarMapLibre', () => ({ cargarMapLibre: vi.fn() }))
const prestador = { id: 7, nombre: 'Prestador de prueba', oficios: ['Plomería'], latitud: -34.6, longitud: -58.4 }
let api, mapas, marcadores, ventanas, observadores

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  mapas = []; marcadores = []; ventanas = []; observadores = []
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { this.callback = callback; this.observe = vi.fn(); this.disconnect = vi.fn(); observadores.push(this) }
  })
  api = {
    Map: vi.fn(function (opciones) {
      this.opciones = opciones
      this.eventos = {}
      this.on = vi.fn((nombre, callback) => { this.eventos[nombre] = callback })
      this.emit = (nombre, evento) => this.eventos[nombre]?.(evento)
      this.addControl = vi.fn(); this.fitBounds = vi.fn(); this.jumpTo = vi.fn()
      this.getContainer = () => opciones.container
      this.easeTo = vi.fn()
      this.getZoom = () => 11; this.areTilesLoaded = () => true
      this.resize = vi.fn(); this.remove = vi.fn()
      mapas.push(this)
    }),
    Marker: vi.fn(function ({ element }) {
      this.element = element
      this.setLngLat = (posicion) => { this.posicion = posicion; return this }
      this.setPopup = (popup) => { this.popup = popup; return this }
      this.abrir = () => this.popup?.addTo()
      this.addTo = (mapa) => {
        this.mapa = mapa
        mapa.opciones.container.append(element)
        element.addEventListener('click', this.abrir)
        return this
      }
      this.remove = vi.fn(() => { this.mapa = null; element.removeEventListener('click', this.abrir); element.remove() })
      marcadores.push(this)
    }),
    Popup: vi.fn(function () {
      this.eventos = {}
      this.on = vi.fn((nombre, callback) => { this.eventos[nombre] = callback; return this })
      this.off = vi.fn((nombre) => { delete this.eventos[nombre]; return this })
      this.emit = (nombre) => this.eventos[nombre]?.()
      this.setDOMContent = (contenido) => { this.contenido = contenido; return this }
      this.addTo = () => { document.body.append(this.contenido); return this }
      this.remove = vi.fn(() => this.contenido?.remove())
      ventanas.push(this)
    }),
    LngLatBounds: vi.fn(function () { this.extend = vi.fn() }),
    NavigationControl: vi.fn(function () {}),
  }
  vi.mocked(cargarMapLibre).mockReset().mockResolvedValue(api)
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); vi.restoreAllMocks() })

async function mostrar(props = {}) {
  const vista = render(<MapaPrestadores prestadores={[prestador]} {...props} />)
  await waitFor(() => expect(api.Map).toHaveBeenCalledTimes(1))
  act(() => mapas[0].emit('load'))
  return vista
}

describe('MapLibre y OpenFreeMap', () => {
  it('reserva espacio al abrir la ventana para que indicaciones y créditos no se superpongan', async () => {
    const vista = await mostrar()
    Object.defineProperty(mapas[0].opciones.container, 'clientHeight', { value: 360 })
    act(() => ventanas[0].emit('open'))
    expect(mapas[0].easeTo).toHaveBeenCalledWith({ center: [-58.4, -34.6], offset: [0, 130], duration: 0 })
    vista.unmount()
    expect(ventanas[0].off).toHaveBeenCalledWith('open', expect.any(Function))
  })
  it('conserva el popup abierto cuando la búsqueda remota actualiza carga o resultados equivalentes', async () => {
    vi.stubEnv('VITE_API_URL', BASE)
    let resolver
    const http = vi.fn(() => new Promise((resolve) => { resolver = resolve }))
    vi.stubGlobal('fetch', http)
    const catalogo = [{ id: 'o1', nombre: 'Plomería' }]
    const inicial = { ...prestador, disponible: true, precioMin: null, precioMax: null, calificacionPromedio: null }
    render(<BuscadorPrestadores prestadores={[inicial]} catalogoOficios={catalogo} marcadoresPublicos={[prestador]} />)
    await waitFor(() => expect(marcadores).toHaveLength(1))
    const primero = marcadores[0]
    fireEvent.click(primero.element)
    await waitFor(() => expect(http).toHaveBeenCalled())
    expect(screen.getByRole('link', { name: /Cómo llegar/ })).toBeInTheDocument()
    await act(async () => resolver(respuesta([{ ...inicial, oficios: catalogo, reputacion: { promedio: null, serviciosFinalizados: 0 } }])))
    expect(screen.getByRole('link', { name: /Cómo llegar/ })).toBeInTheDocument()
    expect(primero.remove).not.toHaveBeenCalled()
    expect(api.Map).toHaveBeenCalledTimes(1)
  })
  it('carga sin clave y conserva créditos, controles y centro inicial', async () => {
    await mostrar()
    expect(mapas[0].opciones.style).toBe('https://tiles.openfreemap.org/styles/liberty')
    expect(mapas[0].opciones.attributionControl).toEqual({ compact: false })
    expect(mapas[0].opciones.center).toEqual([-58.3816, -34.6037])
    expect(mapas[0].addControl).toHaveBeenCalledWith(expect.anything(), 'top-right')
    expect(screen.getByRole('region', { name: /Mapa interactivo/ })).toHaveAttribute('aria-busy', 'false')
  })

  it('muestra carga mientras el módulo está pendiente', () => {
    vi.mocked(cargarMapLibre).mockReturnValue(new Promise(() => {}))
    render(<MapaPrestadores />)
    expect(screen.getByText('Cargando mapa...')).toBeInTheDocument()
  })

  it('sin coordenadas mantiene mensaje y centro predeterminado', async () => {
    await mostrar({ prestadores: [{ id: 1, nombre: 'Sin ubicación' }] })
    expect(marcadores).toHaveLength(0)
    expect(mapas[0].jumpTo).toHaveBeenCalledWith({ center: [-58.3816, -34.6037], zoom: 11 })
    expect(screen.getByText(/Todavía no hay prestadores con coordenadas/)).toBeInTheDocument()
  })

  it('solo muestra ubicaciones válidas en orden longitud/latitud', async () => {
    await mostrar({ prestadores: [prestador, { id: 2, lat: 100, lng: 0 }, { id: 3 }] })
    expect(marcadores).toHaveLength(1)
    expect(marcadores[0].posicion).toEqual([-58.4, -34.6])
    expect(screen.getByRole('button', { name: prestador.nombre })).toHaveAttribute('tabindex', '0')
    expect(mapas[0].jumpTo).toHaveBeenCalledWith({ center: [-58.4, -34.6], zoom: 13 })
  })

  it('abre nombre, servicio, selección de ficha e indicaciones seguras', async () => {
    const seleccionar = vi.fn()
    await mostrar({ onSeleccionar: seleccionar })
    fireEvent.click(screen.getByRole('button', { name: prestador.nombre }))
    expect(screen.getByText('Plomería')).toBeInTheDocument()
    expect(screen.getByText(prestador.nombre)).toBeInTheDocument()
    const enlace = screen.getByRole('link', { name: /Cómo llegar/ })
    expect(enlace).toHaveAttribute('rel', 'noopener noreferrer')
    expect(enlace).toHaveAttribute('target', '_blank')
    expect(new URL(enlace.href).searchParams.get('destination')).toBe('-34.6,-58.4')
    fireEvent.click(screen.getByRole('button', { name: 'Ver perfil' }))
    expect(seleccionar).toHaveBeenCalledWith(7)
  })

  it('trata nombres como texto y omite ficha sin callback', async () => {
    const nombre = '<img src=x onerror=alert(1)>'
    await mostrar({ prestadores: [{ ...prestador, nombre }] })
    fireEvent.click(screen.getByRole('button', { name: nombre }))
    expect(ventanas[0].contenido.querySelector('img')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Ver perfil' })).not.toBeInTheDocument()
  })

  it('actualiza límites y filtros sin recrear el mapa', async () => {
    const vista = await mostrar({ prestadores: [prestador, { ...prestador, id: 8, latitud: -35 }] })
    expect(mapas[0].fitBounds).toHaveBeenCalledWith(expect.anything(), { padding: 48, maxZoom: 14, duration: 0 })
    const anterior = marcadores[0]
    vista.rerender(<MapaPrestadores prestadores={[prestador]} />)
    expect(api.Map).toHaveBeenCalledTimes(1)
    expect(anterior.remove).toHaveBeenCalled()
    expect(mapas[0].jumpTo).toHaveBeenLastCalledWith({ center: [-58.4, -34.6], zoom: 13 })
  })

  it('maneja fallos del módulo o WebGL sin bloquear listado', async () => {
    vi.mocked(cargarMapLibre).mockRejectedValue(new Error('WebGL no disponible'))
    render(<MapaPrestadores />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Podés seguir usando el listado')
  })

  it('maneja errores de inicialización', async () => {
    api.Map.mockImplementation(() => { throw new Error('Contexto WebGL') })
    render(<MapaPrestadores />)
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('muestra errores de cartografía manteniendo el mapa y listado accesibles', async () => {
    await mostrar()
    act(() => mapas[0].emit('error'))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /Mapa interactivo/ })).toBeVisible()
  })

  it('conserva el error concreto aunque después se emitan load o idle', async () => {
    await mostrar()
    const error = new Error('HTTP 504: recurso de cartografía no disponible')
    act(() => mapas[0].emit('error', { error }))
    expect(console.error).toHaveBeenCalledWith('[ServiMap/mapa]', error)
    expect(screen.getByText(error.message)).toBeInTheDocument()
    act(() => { mapas[0].emit('load'); mapas[0].emit('idle') })
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('avisa si el estilo no responde dentro del tiempo previsto', async () => {
    await mostrar()
    vi.useFakeTimers()
    // Un montaje nuevo permite comprobar el timeout inicial sin simular red real.
    cleanup()
    render(<MapaPrestadores />)
    await act(async () => { await Promise.resolve() })
    await act(async () => vi.advanceTimersByTimeAsync(20000))
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('preserva ubicación y recentrado fuera del mapa', async () => {
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: vi.fn((ok) => ok({ coords: { latitude: -34.5, longitude: -58.3 } })) } })
    await mostrar()
    fireEvent.click(screen.getByRole('button', { name: 'Usar mi ubicación' }))
    expect(mapas[0].jumpTo).toHaveBeenLastCalledWith({ center: [-58.3, -34.5], zoom: 13 })
    fireEvent.click(screen.getByRole('button', { name: 'Centrar en mi ubicación' }))
    expect(screen.getByText('Ubicación obtenida correctamente.')).toBeInTheDocument()
    expect(marcadores).toHaveLength(2)
  })

  it('maneja permiso de ubicación rechazado', async () => {
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: vi.fn((ok, fallo) => fallo()) } })
    await mostrar()
    fireEvent.click(screen.getByRole('button', { name: 'Usar mi ubicación' }))
    expect(screen.getByText(/No se pudo obtener tu ubicación/)).toBeInTheDocument()
  })

  it('adapta el canvas y limpia mapa, popups, marcadores y observador', async () => {
    const vista = await mostrar()
    act(() => observadores[0].callback())
    expect(mapas[0].resize).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: prestador.nombre }))
    vista.unmount()
    expect(marcadores[0].remove).toHaveBeenCalled()
    expect(ventanas[0].remove).toHaveBeenCalled()
    expect(mapas[0].remove).toHaveBeenCalledTimes(1)
    expect(observadores[0].disconnect).toHaveBeenCalled()
    expect(screen.queryByRole('link', { name: /Cómo llegar/ })).not.toBeInTheDocument()
  })

  it('no crea mapas tras desmontar una carga pendiente', async () => {
    let resolver
    vi.mocked(cargarMapLibre).mockReturnValue(new Promise((resolve) => { resolver = resolve }))
    const vista = render(<MapaPrestadores />)
    vista.unmount()
    await act(async () => resolver(api))
    expect(api.Map).not.toHaveBeenCalled()
  })

  it('tolera StrictMode sin duplicar mapas activos', async () => {
    render(<StrictMode><MapaPrestadores prestadores={[prestador]} /></StrictMode>)
    await waitFor(() => expect(marcadores.filter((m) => m.mapa)).toHaveLength(1))
    expect(api.Map).toHaveBeenCalledTimes(1)
  })
})
