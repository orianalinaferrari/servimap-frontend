import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
      this.off = vi.fn((nombre, callback) => { if (this.eventos[nombre] === callback) delete this.eventos[nombre] })
      this.emit = (nombre, evento) => this.eventos[nombre]?.(evento)
      this.addControl = vi.fn(); this.fitBounds = vi.fn(); this.jumpTo = vi.fn()
      this.getContainer = () => opciones.container
      this.easeTo = vi.fn()
      this.getZoom = () => 11; this.areTilesLoaded = () => true
      this.getCenter = vi.fn(() => ({ lng: 2.35, lat: 48.86 }))
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
  function elegir(lng = 2.35, lat = 48.86, target = mapas[0].opciones.container) {
    act(() => mapas[0].emit('click', { lngLat: { lng, lat }, originalEvent: { target } }))
  }

  const ecuador = { ...prestador, latitud: 0, longitud: 1, zonaCobertura: 'Centro', precioMin: 10, precioMax: 20, disponible: true, calificacionPromedio: null, trabajosFinalizados: 0 }

  it('actualiza tarjetas con referencia manual y GPS, mantiene el orden y avisa si falta ubicación', async () => {
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: vi.fn(ok => ok({ coords: { latitude: 0, longitude: 0 } })) } })
    render(<BuscadorPrestadores prestadores={[ecuador, { ...ecuador, id: 8, nombre: 'Sin coordenadas', latitud: null, longitud: null }]} />)
    await waitFor(() => expect(api.Map).toHaveBeenCalledTimes(1))
    act(() => mapas[0].emit('load'))
    const lista = screen.getByRole('list')
    expect(within(lista).queryByText(/Distancia/)).not.toBeInTheDocument()
    elegir(0, 0)
    expect(within(lista).getByText(/111,2 km en línea recta \(no por calles\)/)).toBeVisible()
    expect(within(lista).getByText('Distancia no disponible')).toBeVisible()
    const nombres = within(lista).getAllByRole('button').map(b => b.getAttribute('aria-label'))
    elegir(1, 0)
    expect(within(lista).getByText(/0,0 km/)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Usar mi ubicación' }))
    expect(within(lista).getByText(/111,2 km/)).toBeVisible()
    expect(within(lista).getAllByRole('button').map(b => b.getAttribute('aria-label'))).toEqual(nombres)
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar ubicación de referencia' }))
    expect(within(lista).queryByText(/Distancia/)).not.toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('mantiene abierto el popup y actualiza solo su texto al cambiar o quitar la referencia', async () => {
    await mostrar({ prestadores: [ecuador] })
    const marcador = marcadores[0], ventana = ventanas[0]
    fireEvent.click(marcador.element)
    expect(within(ventana.contenido).queryByText(/Distancia/)).not.toBeInTheDocument()
    elegir(0, 0)
    expect(within(ventana.contenido).getByText(/111,2 km/)).toBeVisible()
    elegir(1, 0)
    expect(within(ventana.contenido).getByText(/0,0 km/)).toBeVisible()
    expect(marcador.remove).not.toHaveBeenCalled()
    expect(ventana.remove).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar ubicación de referencia' }))
    expect(within(ventana.contenido).queryByText(/Distancia/)).not.toBeInTheDocument()
    expect(within(ventana.contenido).getByRole('link', { name: /Cómo llegar/ })).toBeVisible()
  })

  it('conserva distancias al filtrar, abrir ficha y volver sin cambiar precios o disponibilidad', async () => {
    render(<BuscadorPrestadores prestadores={[ecuador]} />)
    await waitFor(() => expect(api.Map).toHaveBeenCalledTimes(1))
    act(() => mapas[0].emit('load'))
    elegir(0, 0)
    fireEvent.change(screen.getByLabelText('Buscar prestador'), { target: { value: 'no existe' } })
    expect(screen.queryByText(/111,2 km/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(screen.getByText(/111,2 km/)).toBeVisible()
    fireEvent.change(screen.getByLabelText('Precio máximo'), { target: { value: '5' } })
    expect(screen.getByText(/No se encontraron prestadores/)).toBeVisible()
    fireEvent.change(screen.getByLabelText('Precio máximo'), { target: { value: '20' } })
    fireEvent.click(screen.getByLabelText('Solo prestadores disponibles'))
    expect(screen.getByText(/111,2 km/)).toBeVisible()
    fireEvent.click(screen.getAllByRole('button', { name: ecuador.nombre }).at(-1))
    expect(within(screen.getByRole('article')).getByText(/111,2 km/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Solicitar servicio' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }))
    expect(screen.getByText(/111,2 km/)).toBeVisible()
    expect(screen.getByLabelText('Precio máximo')).toHaveValue(20)
    expect(screen.getByLabelText('Solo prestadores disponibles')).toBeChecked()
  })

  it('recalcula resultados remotos y ficha con coordenadas públicas, conserva referencia ante un error API', async () => {
    vi.stubEnv('VITE_API_URL', BASE)
    const catalogo = [{ id: 'o1', nombre: 'Plomería' }]
    const remoto = { ...ecuador, longitud: 2, oficios: catalogo, reputacion: { promedio: null, serviciosFinalizados: 0 }, comentarios: [] }
    const http = vi.fn(async url => new URL(url).searchParams.get('q') === 'fallo'
      ? respuesta({ error: 'Error de búsqueda de prueba' }, 500)
      : respuesta(new URL(url).pathname === '/api/prestadores' ? [remoto] : remoto))
    vi.stubGlobal('fetch', http)
    render(<BuscadorPrestadores prestadores={[ecuador]} catalogoOficios={catalogo} marcadoresPublicos={[ecuador]} />)
    await waitFor(() => expect(api.Map).toHaveBeenCalledTimes(1))
    act(() => mapas[0].emit('load'))
    elegir(0, 0)
    expect(await screen.findByText(/222,4 km/)).toBeVisible()
    fireEvent.click(screen.getAllByRole('button', { name: ecuador.nombre }).at(-1))
    expect(await screen.findByText(/222,4 km/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Solicitar servicio' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }))
    fireEvent.change(screen.getByLabelText('Buscar prestador'), { target: { value: 'fallo' } })
    expect(await screen.findByRole('alert')).toHaveTextContent('Error de búsqueda de prueba')
    expect(screen.getByText(/Latitud 0.00000, longitud 0.00000/)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(await screen.findByText(/222,4 km/)).toBeVisible()
    for (const [url, opciones] of http.mock.calls) {
      expect(new URL(url).pathname).not.toContain('/me')
      expect(new URL(url).searchParams.has('lat')).toBe(false)
      expect(new URL(url).searchParams.has('lng')).toBe(false)
      expect(opciones.method ?? 'GET').toBe('GET')
    }
  })

  it('elige una referencia fuera de Argentina sin solicitar GPS ni enviar datos', async () => {
    const gps = vi.fn()
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: gps } })
    const cambio = vi.fn()
    await mostrar({ onCambiarUbicacionReferencia: cambio })
    elegir()
    expect(gps).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
    expect(cambio).toHaveBeenLastCalledWith({ latitud: 48.86, longitud: expect.closeTo(2.35), origen: 'manual' })
    expect(screen.getByRole('img', { name: 'Ubicación de referencia elegida en el mapa' })).toHaveClass('mapa-referencia-manual')
    expect(screen.getByText(/Latitud 48.86000, longitud 2.35000/)).toBeVisible()
    expect(api.Map).toHaveBeenCalledTimes(1)
    expect(prestador.latitud).toBe(-34.6)
    expect(prestador.longitud).toBe(-58.4)
  })

  it('reemplaza y limpia solo el marcador de referencia sin recrear prestadores ni popups', async () => {
    const cambio = vi.fn()
    await mostrar({ onCambiarUbicacionReferencia: cambio })
    const publico = marcadores[0]
    fireEvent.click(publico.element)
    elegir()
    const referencia = marcadores.at(-1)
    elegir(139.69, 35.68)
    expect(referencia.remove).toHaveBeenCalledTimes(1)
    expect(publico.remove).not.toHaveBeenCalled()
    expect(screen.getByRole('link', { name: /Cómo llegar/ })).toBeInTheDocument()
    expect(marcadores.filter(m => m.mapa)).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar ubicación de referencia' }))
    expect(cambio).toHaveBeenLastCalledWith(null)
    expect(screen.queryByRole('img', { name: /Ubicación de referencia elegida/ })).not.toBeInTheDocument()
    expect(screen.getByText('Ubicación de referencia eliminada.')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Usar centro del mapa como referencia' })).toHaveFocus()
    expect(marcadores.filter(m => m.mapa)).toEqual([publico])
    expect(publico.remove).not.toHaveBeenCalled()
  })

  it('permite elegir el centro con un control accesible y recentrar conservando el zoom', async () => {
    await mostrar()
    const boton = screen.getByRole('button', { name: 'Usar centro del mapa como referencia' })
    expect(boton).toHaveAccessibleDescription(/Con teclado/)
    act(() => boton.focus())
    fireEvent.click(boton)
    expect(mapas[0].getCenter).toHaveBeenCalled()
    expect(boton).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Centrar en la referencia' }))
    expect(mapas[0].jumpTo).toHaveBeenLastCalledWith({ center: [expect.closeTo(2.35), 48.86], zoom: 11 })
  })

  it('no cambia la cámara al seleccionar ni al actualizar los prestadores con una referencia elegida', async () => {
    const vista = await mostrar()
    mapas[0].jumpTo.mockClear()
    elegir()
    vista.rerender(<MapaPrestadores prestadores={[{ ...prestador, id: 9, latitud: 40 }]} />)
    expect(mapas[0].jumpTo).not.toHaveBeenCalled()
    expect(mapas[0].fitBounds).not.toHaveBeenCalled()
    expect(screen.getByText(/Latitud 48.86000/)).toBeVisible()
  })

  it.each(['mapa-marcador', 'maplibregl-marker', 'maplibregl-popup', 'maplibregl-control-container'])('no selecciona una referencia al interactuar con %s', async (clase) => {
    const cambio = vi.fn()
    await mostrar({ onCambiarUbicacionReferencia: cambio })
    const elemento = document.createElement('div')
    elemento.className = clase
    const hijo = document.createElement('button')
    elemento.append(hijo)
    elegir(2, 48, hijo)
    expect(cambio).not.toHaveBeenCalled()
  })

  it.each([[NaN, 40], [2, NaN], [Infinity, 0], [0, 91], [0, -91]])('ignora puntos inválidos (%s, %s)', async (lng, lat) => {
    const cambio = vi.fn()
    await mostrar({ onCambiarUbicacionReferencia: cambio })
    elegir(lng, lat)
    expect(cambio).not.toHaveBeenCalled()
  })

  it('normaliza copias del mundo y acepta el ecuador y meridiano cero', async () => {
    const cambio = vi.fn()
    await mostrar({ onCambiarUbicacionReferencia: cambio })
    elegir(370, 0)
    expect(cambio).toHaveBeenLastCalledWith({ latitud: 0, longitud: 10, origen: 'manual' })
    elegir(0, 0)
    expect(cambio).toHaveBeenLastCalledWith({ latitud: 0, longitud: 0, origen: 'manual' })
  })

  it('mantiene la selección manual si llega tarde la respuesta o el error del GPS', async () => {
    let ok, fallo
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: vi.fn((resolver, rechazar) => { ok = resolver; fallo = rechazar }) } })
    await mostrar()
    fireEvent.click(screen.getByRole('button', { name: 'Usar mi ubicación' }))
    elegir()
    act(() => { ok({ coords: { latitude: -34.5, longitude: -58.3 } }); fallo() })
    expect(screen.getByText(/Latitud 48.86000/)).toBeVisible()
    expect(screen.getByText(/Ubicación de referencia seleccionada/)).toBeVisible()
  })

  it('limpiar la referencia invalida una solicitud de GPS pendiente', async () => {
    let ok
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: vi.fn(resolver => { ok = resolver }) } })
    await mostrar()
    elegir()
    fireEvent.click(screen.getByRole('button', { name: 'Usar mi ubicación' }))
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar ubicación de referencia' }))
    act(() => ok({ coords: { latitude: 40, longitude: 2 } }))
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('Ubicación de referencia eliminada.')).toBeVisible()
  })

  it('continúa con selección manual sin geolocalización disponible o con permiso denegado', async () => {
    vi.stubGlobal('navigator', {})
    await mostrar()
    fireEvent.click(screen.getByRole('button', { name: 'Usar mi ubicación' }))
    expect(screen.getByText(/Tu navegador no permite/)).toBeVisible()
    elegir()
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: vi.fn((ok, fallo) => fallo()) } })
    fireEvent.click(screen.getByRole('button', { name: 'Usar mi ubicación' }))
    expect(screen.getByText(/No se pudo obtener tu ubicación/)).toBeVisible()
    expect(screen.getByText(/Latitud 48.86000/)).toBeVisible()
    elegir(0, 0)
    expect(screen.getByText(/Latitud 0.00000/)).toBeVisible()
  })

  it('rechaza coordenadas inválidas del GPS y no cambia la referencia anterior', async () => {
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: vi.fn(ok => ok({ coords: { latitude: 100, longitude: 2 } })) } })
    await mostrar()
    elegir()
    fireEvent.click(screen.getByRole('button', { name: 'Usar mi ubicación' }))
    expect(screen.getByText(/no devolvió una ubicación válida/)).toBeVisible()
    expect(screen.getByText(/Latitud 48.86000/)).toBeVisible()
  })

  it('limpia el listener de selección al desmontar e ignora un GPS tardío', async () => {
    let ok
    const cambio = vi.fn()
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: vi.fn(resolver => { ok = resolver }) } })
    const vista = await mostrar({ onCambiarUbicacionReferencia: cambio })
    fireEvent.click(screen.getByRole('button', { name: 'Usar mi ubicación' }))
    vista.unmount()
    act(() => ok({ coords: { latitude: 40, longitude: 2 } }))
    expect(cambio).not.toHaveBeenCalled()
    expect(mapas[0].off).toHaveBeenCalledWith('click', expect.any(Function))
  })

  it('conserva la referencia al filtrar y al abrir y cerrar una ficha del directorio', async () => {
    render(<BuscadorPrestadores prestadores={[{ ...prestador, disponible: true, calificacionPromedio: null, trabajosFinalizados: 0, precioMin: null, precioMax: null }]} />)
    await waitFor(() => expect(api.Map).toHaveBeenCalledTimes(1))
    act(() => mapas[0].emit('load'))
    elegir()
    fireEvent.change(screen.getByLabelText('Buscar prestador'), { target: { value: 'No existe' } })
    expect(screen.getByText(/Latitud 48.86000/)).toBeVisible()
    expect(screen.getByText(/No se encontraron prestadores/)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    fireEvent.click(screen.getAllByRole('button', { name: prestador.nombre }).at(-1))
    expect(screen.queryByText(/Latitud 48.86000/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Volver/ }))
    expect(screen.getByText(/Latitud 48.86000/)).toBeVisible()
    await waitFor(() => expect(api.Map).toHaveBeenCalledTimes(2))
    expect(mapas[1].opciones.center).toEqual([expect.closeTo(2.35), 48.86])
  })

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
