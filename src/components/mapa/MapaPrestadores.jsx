import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '../../styles/MapaPrestadores.css'
import { obtenerCoordenadas, prestadoresConUbicacion } from '../../utils/coordenadasPrestadores'

const iconoPrestador = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function CentrarMapa({ posicion }) {
  const mapa = useMap()

  function centrar() {
    mapa.setView(posicion, Math.max(mapa.getZoom(), 13))
  }

  return (
    <button type="button" className="mapa-centrar" onClick={centrar}>
      Centrar en mi ubicación
    </button>
  )
}

export function MapaPrestadores({ prestadores = [], onSeleccionar }) {
  const [ubicacion, setUbicacion] = useState(null)
  const [estadoUbicacion, setEstadoUbicacion] = useState('')
  const disponibles = prestadoresConUbicacion(prestadores)

  function solicitarUbicacion() {
    if (!navigator.geolocation) {
      setEstadoUbicacion('Tu navegador no permite obtener la ubicación.')
      return
    }

    setEstadoUbicacion('Obteniendo ubicación...')

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUbicacion([coords.latitude, coords.longitude])
        setEstadoUbicacion('Ubicación obtenida correctamente.')
      },
      () => setEstadoUbicacion('No se pudo obtener tu ubicación. Podés seguir usando el mapa.'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    )
  }

  return (
    <section className="mapa-prestadores" aria-label="Mapa de prestadores">
      <h3>Prestadores en el mapa</h3>
      <p>Mapa de OpenStreetMap. Las ubicaciones se muestran cuando el prestador tiene coordenadas registradas.</p>

      <button type="button" onClick={solicitarUbicacion}>
        Usar mi ubicación
      </button>
      {estadoUbicacion && <p role="status">{estadoUbicacion}</p>}

      <div className="mapa-contenedor">
        <MapContainer
          center={[-34.6037, -58.3816]}
          zoom={11}
          scrollWheelZoom={false}
          className="mapa-leaflet"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {disponibles.map((prestador) => (
            <Marker
              key={prestador.id}
              position={obtenerCoordenadas(prestador)}
              icon={iconoPrestador}
            >
              <Popup>
                <strong>{prestador.nombre}</strong>
                <p>{Array.isArray(prestador.oficios) ? prestador.oficios.join(', ') : ''}</p>
                <p>{prestador.zonaCobertura}</p>
                {onSeleccionar && (
                  <button type="button" onClick={() => onSeleccionar(prestador.id)}>
                    Ver perfil
                  </button>
                )}
              </Popup>
            </Marker>
          ))}

          {ubicacion && (
            <CircleMarker
              center={ubicacion}
              radius={9}
              pathOptions={{ color: '#2563eb', fillColor: '#60a5fa', fillOpacity: 0.8 }}
            >
              <Popup>Tu ubicación aproximada</Popup>
            </CircleMarker>
          )}

          {ubicacion && <CentrarMapa posicion={ubicacion} />}
        </MapContainer>
      </div>

      {disponibles.length === 0 && (
        <p role="status">
          Todavía no hay prestadores con coordenadas registradas.
          Podés encontrarlos en el listado.
        </p>
      )}
    </section>
  )
}
