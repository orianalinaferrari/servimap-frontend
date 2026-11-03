import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import '../../styles/MapaPrestadores.css'
import { obtenerCoordenadas, prestadoresConUbicacion } from '../../utils/coordenadasPrestadores'
import { cargarMapLibre } from './cargarMapLibre'
import { textoDistancia } from '../../utils/distancias'

const CENTRO_INICIAL = [-58.3816, -34.6037]

function posicionPrestador(prestador) {
  const [lat, lng] = obtenerCoordenadas(prestador)
  return [lng, lat]
}

function crearContenido(prestador, onSeleccionar) {
  const contenido = document.createElement('div')
  contenido.className = 'mapa-info'
  const titulo = document.createElement('strong')
  titulo.textContent = prestador.nombre || 'Prestador'
  contenido.append(titulo)
  const distancia = document.createElement('p')
  distancia.className = 'distancia-prestador'
  distancia.hidden = true
  contenido.append(distancia)
  const oficios = Array.isArray(prestador.oficios) ? prestador.oficios.join(', ') : prestador.oficios
  for (const texto of [oficios || prestador.servicio, prestador.zonaCobertura]) {
    if (typeof texto === 'string' && texto) {
      const parrafo = document.createElement('p')
      parrafo.textContent = texto
      contenido.append(parrafo)
    }
  }
  if (onSeleccionar && prestador.id != null) {
    const perfil = document.createElement('button')
    perfil.type = 'button'
    perfil.textContent = 'Ver perfil'
    // La ficha existente se abre por selección, sin inventar una ruta nueva.
    perfil.onclick = () => onSeleccionar(prestador.id)
    contenido.append(perfil)
  }
  const indicaciones = document.createElement('a')
  const [lng, lat] = posicionPrestador(prestador)
  indicaciones.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`
  indicaciones.target = '_blank'
  indicaciones.rel = 'noopener noreferrer'
  indicaciones.textContent = 'Cómo llegar en Google Maps'
  contenido.append(indicaciones)
  return contenido
}

function MapaInteractivo({ disponibles, onSeleccionar, referencia, onElegirReferencia, instruccionesId, botonCentro }) {
  const contenedor = useRef(null)
  const referenciaInicial = useRef(referencia)
  const popupsActuales = useRef([])
  const [recursos, setRecursos] = useState(null)
  const [estado, setEstado] = useState('cargando')
  const [detalleError, setDetalleError] = useState('')
  const ubicacion = useMemo(() => referencia ? [referencia.longitud, referencia.latitud] : null, [referencia])

  useEffect(() => {
    let activo = true
    let mapa
    let observador
    let temporizador
    const errores = new Set()
    const cargar = () => {
      if (!activo) return
      clearTimeout(temporizador)
      if (errores.size === 0) setEstado('listo')
    }
    const fallo = (evento) => {
      if (!activo) return
      clearTimeout(temporizador)
      const error = evento?.error || evento
      const mensaje = error?.message || 'Error de cartografía sin detalle del proveedor.'
      if (!errores.has(mensaje)) console.error('[ServiMap/mapa]', error || mensaje)
      errores.add(mensaje)
      setDetalleError(mensaje)
      setEstado('error')
    }
    cargarMapLibre().then((api) => {
      if (!activo) return
      mapa = new api.Map({
        container: contenedor.current,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: referenciaInicial.current ? [referenciaInicial.current.longitud, referenciaInicial.current.latitud] : CENTRO_INICIAL,
        zoom: 11, maxZoom: 18,
        cooperativeGestures: true,
        attributionControl: { compact: false },
        locale: {
          'NavigationControl.ZoomIn': 'Acercar',
          'NavigationControl.ZoomOut': 'Alejar',
          'NavigationControl.ResetBearing': 'Orientar al norte',
          'AttributionControl.ToggleAttribution': 'Créditos cartográficos',
          'Popup.Close': 'Cerrar información',
          'Map.Title': 'Mapa de prestadores',
          'CooperativeGesturesHandler.WindowsHelpText': 'Usá Ctrl + rueda para acercar el mapa',
          'CooperativeGesturesHandler.MacHelpText': 'Usá ⌘ + rueda para acercar el mapa',
          'CooperativeGesturesHandler.MobileHelpText': 'Usá dos dedos para mover el mapa',
        },
      })
      mapa.addControl(new api.NavigationControl({ showCompass: false }), 'top-right')
      mapa.on('load', cargar)
      mapa.on('error', fallo)
      temporizador = setTimeout(() => fallo(new Error('La cartografía no respondió en 20 segundos.')), 20000)
      if (typeof ResizeObserver !== 'undefined') {
        observador = new ResizeObserver(() => mapa.resize())
        observador.observe(contenedor.current)
      }
      setRecursos({ api, mapa })
    }).catch(fallo)
    return () => {
      activo = false
      clearTimeout(temporizador)
      observador?.disconnect()
      mapa?.remove()
    }
  }, [])

  useEffect(() => {
    if (!recursos) return
    const { api, mapa } = recursos
    const marcadores = disponibles.map((prestador) => {
      const posicion = posicionPrestador(prestador)
      // MapLibre gestiona Enter/Espacio al asociar el popup. Un botón nativo
      // también emitiría click y podría alternar el popup dos veces.
      const elemento = document.createElement('div')
      elemento.setAttribute('role', 'button')
      elemento.tabIndex = 0
      elemento.className = 'mapa-marcador'
      elemento.setAttribute('aria-label', prestador.nombre || 'Prestador')
      elemento.textContent = 'S'
      const contenido = crearContenido(prestador, onSeleccionar)
      const ventana = new api.Popup({ anchor: 'bottom', offset: 24, maxWidth: '280px', focusAfterOpen: true })
        .setDOMContent(contenido)
      const mostrarVentanaCompleta = () => {
        // Reservar espacio para la ventana y los créditos, también en móvil.
        const altura = mapa.getContainer().clientHeight
        mapa.easeTo({ center: posicion, offset: [0, Math.max(0, altura / 2 - 50)], duration: 0 })
      }
      ventana.on('open', mostrarVentanaCompleta)
      const marcador = new api.Marker({ element: elemento, anchor: 'bottom' })
        .setLngLat(posicion).setPopup(ventana).addTo(mapa)
      return { prestador, marcador, ventana, contenido, mostrarVentanaCompleta }
    })
    popupsActuales.current = marcadores
    return () => {
      popupsActuales.current = []
      marcadores.forEach(({ marcador, ventana, contenido, mostrarVentanaCompleta }) => {
        const boton = contenido.querySelector('button')
        if (boton) boton.onclick = null
        ventana.off('open', mostrarVentanaCompleta)
        ventana.remove()
        marcador.remove()
      })
    }
  }, [recursos, disponibles, onSeleccionar])

  useEffect(() => {
    for (const { prestador, contenido } of popupsActuales.current) {
      const texto = textoDistancia(referencia, prestador)
      const elemento = contenido.querySelector('.distancia-prestador')
      elemento.textContent = texto ?? ''
      elemento.hidden = texto === null
    }
  }, [recursos, disponibles, onSeleccionar, referencia])

  useEffect(() => {
    if (!recursos || ubicacion) return
    const { api, mapa } = recursos
    const limites = new api.LngLatBounds()
    disponibles.forEach((prestador) => limites.extend(posicionPrestador(prestador)))
    if (disponibles.length > 1) mapa.fitBounds(limites, { padding: 48, maxZoom: 14, duration: 0 })
    else mapa.jumpTo({ center: disponibles.length ? posicionPrestador(disponibles[0]) : CENTRO_INICIAL, zoom: disponibles.length ? 13 : 11 })
  }, [recursos, disponibles, ubicacion])

  useEffect(() => {
    if (!recursos) return
    const elegir = (evento) => {
      if (evento.originalEvent?.target?.closest?.('.maplibregl-marker, .mapa-marcador, .maplibregl-popup, .maplibregl-control-container')) return
      onElegirReferencia(evento.lngLat)
    }
    recursos.mapa.on('click', elegir)
    return () => recursos.mapa.off('click', elegir)
  }, [recursos, onElegirReferencia])

  useEffect(() => {
    if (!recursos || !ubicacion) return
    const { api, mapa } = recursos
    const elemento = document.createElement('span')
    elemento.className = `mapa-ubicacion${referencia.origen === 'manual' ? ' mapa-referencia-manual' : ''}`
    elemento.setAttribute('role', 'img')
    elemento.setAttribute('aria-label', referencia.origen === 'manual' ? 'Ubicación de referencia elegida en el mapa' : 'Tu ubicación aproximada')
    const marcador = new api.Marker({ element: elemento }).setLngLat(ubicacion).addTo(mapa)
    if (referencia.origen === 'gps') mapa.jumpTo({ center: ubicacion, zoom: Math.max(mapa.getZoom(), 13) })
    return () => { marcador.remove() }
  }, [recursos, ubicacion, referencia])

  return (
    <>
      {estado === 'cargando' && <p role="status">Cargando mapa...</p>}
      {estado === 'error' && <p role="alert">No se pudo cargar toda la cartografía. Podés seguir usando el listado. Revisá tu conexión o recargá la página.</p>}
      {estado === 'error' && <details className="mapa-error-detalle"><summary>Ver detalle del error</summary><p>{detalleError}</p></details>}
      {ubicacion && recursos && (
        <button type="button" className="mapa-centrar" onClick={() => {
          recursos.mapa.jumpTo({ center: ubicacion, zoom: referencia.origen === 'gps' ? Math.max(recursos.mapa.getZoom(), 13) : recursos.mapa.getZoom() })
        }}>{referencia.origen === 'gps' ? 'Centrar en mi ubicación' : 'Centrar en la referencia'}</button>
      )}
      <button ref={botonCentro} className="mapa-elegir-centro" type="button" disabled={!recursos || estado !== 'listo'} onClick={() => onElegirReferencia(recursos.mapa.getCenter())} aria-describedby={instruccionesId}>Usar centro del mapa como referencia</button>
      <div className="mapa-contenedor">
        <div ref={contenedor} className="mapa-interactivo" role="region" aria-label="Mapa interactivo de prestadores" aria-describedby={instruccionesId} aria-busy={estado === 'cargando'} />
      </div>
    </>
  )
}

export function MapaPrestadores({ prestadores = [], onSeleccionar, ubicacionReferencia, onCambiarUbicacionReferencia }) {
  const [referenciaLocal, setReferenciaLocal] = useState(null)
  const referencia = ubicacionReferencia === undefined ? referenciaLocal : ubicacionReferencia
  const [estadoUbicacion, setEstadoUbicacion] = useState('')
  const instruccionesId = useId()
  const botonCentro = useRef(null)
  const activo = useRef(true)
  const versionUbicacion = useRef(0)
  useEffect(() => { activo.current = true; return () => { activo.current = false; versionUbicacion.current += 1 } }, [])
  const disponibles = useMemo(() => prestadoresConUbicacion(prestadores), [prestadores])

  const actualizarReferencia = useCallback((nueva) => {
    versionUbicacion.current += 1
    if (ubicacionReferencia === undefined) setReferenciaLocal(nueva)
    onCambiarUbicacionReferencia?.(nueva)
  }, [ubicacionReferencia, onCambiarUbicacionReferencia])

  const elegirReferencia = useCallback((punto) => {
    if (!Number.isFinite(punto?.lng) || !Number.isFinite(punto?.lat)) return
    // Envolver la longitud mantiene el punto real al recorrer copias del mundo.
    const longitud = ((punto.lng + 180) % 360 + 360) % 360 - 180
    if (!obtenerCoordenadas({ latitud: punto.lat, longitud })) return
    actualizarReferencia({ latitud: punto.lat, longitud, origen: 'manual' })
    setEstadoUbicacion('Ubicación de referencia seleccionada. Podés cambiarla tocando otro punto del mapa.')
  }, [actualizarReferencia])

  function solicitarUbicacion() {
    const version = ++versionUbicacion.current
    if (!navigator.geolocation) {
      setEstadoUbicacion('Tu navegador no permite obtener la ubicación.')
      return
    }
    setEstadoUbicacion('Obteniendo ubicación...')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!activo.current || version !== versionUbicacion.current) return
        if (!obtenerCoordenadas({ latitud: coords.latitude, longitud: coords.longitude })) {
          setEstadoUbicacion('El navegador no devolvió una ubicación válida. Podés elegir un punto en el mapa.')
          return
        }
        actualizarReferencia({ latitud: coords.latitude, longitud: coords.longitude, origen: 'gps' })
        setEstadoUbicacion('Ubicación obtenida correctamente.')
      },
      () => { if (activo.current && version === versionUbicacion.current) setEstadoUbicacion('No se pudo obtener tu ubicación. Podés seguir usando el mapa y elegir un punto manualmente.') },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    )
  }

  return (
    <section className="mapa-prestadores" aria-label="Mapa de prestadores">
      <h3>Prestadores en el mapa</h3>
      <p>Cartografía de OpenStreetMap provista por OpenFreeMap. Las ubicaciones se muestran cuando el prestador tiene coordenadas registradas.</p>
      <button type="button" onClick={solicitarUbicacion}>Usar mi ubicación</button>
      <p id={instruccionesId}>Hacé clic o tocá cualquier punto del mapa para elegir tu referencia. Podés alejar el mapa y moverlo a otro lugar. Con teclado, enfocá el mapa, movelo con las flechas y usá el botón «Usar centro del mapa como referencia».</p>
      <p>Esta referencia se usa solo en esta búsqueda. No cambia el perfil de ningún prestador ni se guarda en el servidor.</p>
      {estadoUbicacion && <p role="status">{estadoUbicacion}</p>}
      {referencia && <div className="mapa-referencia-datos">
        <p><strong>{referencia.origen === 'manual' ? 'Referencia elegida en el mapa' : 'Referencia obtenida por GPS'}:</strong> Latitud {referencia.latitud.toFixed(5)}, longitud {referencia.longitud.toFixed(5)}</p>
        <button type="button" onClick={() => { actualizarReferencia(null); setEstadoUbicacion('Ubicación de referencia eliminada.'); botonCentro.current?.focus() }}>Limpiar ubicación de referencia</button>
      </div>}
      <MapaInteractivo disponibles={disponibles} onSeleccionar={onSeleccionar} referencia={referencia} onElegirReferencia={elegirReferencia} instruccionesId={instruccionesId} botonCentro={botonCentro} />
      {disponibles.length === 0 && (
        <p className="mapa-sin-coordenadas" role="status"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 23S3 14 3 9a9 9 0 0 1 18 0c0 5-9 14-9 14ZM12 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" /></svg>Todavía no hay prestadores con coordenadas registradas. Podés encontrarlos en el listado.</p>
      )}
    </section>
  )
}
