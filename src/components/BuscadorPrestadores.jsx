import { useState } from 'react'
import { MapaPrestadores } from './mapa/MapaPrestadores'
import { DetallePrestador } from './DetallePrestador'
import {
  FILTROS_INICIALES,
  aplicarFiltrosPrestadores,
  obtenerOpcionesFiltros,
} from '../utils/filtrosPrestadores'
import '../styles/FiltrosPrestadores.css'

export function BuscadorPrestadores({ prestadores, calificaciones = [] }) {
  const [termino, setTermino] = useState('')
  const [filtros, setFiltros] = useState({ ...FILTROS_INICIALES })
  const [prestadorSeleccionadoId, setPrestadorSeleccionadoId] = useState(null)
  const precioNegativo =
    filtros.precioMaximo !== '' && Number(filtros.precioMaximo) < 0
  const opciones = obtenerOpcionesFiltros(prestadores)
  const resultados = aplicarFiltrosPrestadores(prestadores, termino, filtros)

  const prestadorSeleccionado = prestadores.find(
    (prestador) => prestador.id === prestadorSeleccionadoId
  )

  function actualizarFiltro(nombre, valor) {
    setFiltros((anteriores) => ({
      ...anteriores,
      [nombre]: valor,
    }))
  }

  function limpiarFiltros() {
    setTermino('')
    setFiltros({ ...FILTROS_INICIALES })
  }

  if (prestadorSeleccionado) {
    return (
      <DetallePrestador
        prestador={prestadorSeleccionado}
        calificaciones={calificaciones}
        onVolver={() => setPrestadorSeleccionadoId(null)}
      />
    )
  }

  return (
    <section className="buscador-prestadores">
      <h2>Buscar profesionales</h2>

      <div className="filtros-prestadores">
        <div className="filtros-campo filtros-busqueda">
          <label htmlFor="busqueda">Buscar prestador</label>
          <input
            id="busqueda"
            type="text"
            value={termino}
            onChange={(evento) => setTermino(evento.target.value)}
            placeholder="Nombre, oficio o zona"
          />
        </div>

        <div className="filtros-grid">
          <div className="filtros-campo">
            <label htmlFor="filtro-oficio">Oficio</label>
            <select
              id="filtro-oficio"
              value={filtros.oficio}
              onChange={(evento) => actualizarFiltro('oficio', evento.target.value)}
            >
              <option value="">Todos los oficios</option>
              {opciones.oficios.map((oficio) => (
                <option key={oficio} value={oficio}>{oficio}</option>
              ))}
            </select>
          </div>

          <div className="filtros-campo">
            <label htmlFor="filtro-zona">Zona</label>
            <select
              id="filtro-zona"
              value={filtros.zona}
              onChange={(evento) => actualizarFiltro('zona', evento.target.value)}
            >
              <option value="">Todas las zonas</option>
              {opciones.zonas.map((zona) => (
                <option key={zona} value={zona}>{zona}</option>
              ))}
            </select>
          </div>

          <div className="filtros-campo">
            <label htmlFor="filtro-precio">Precio máximo</label>
            <input
              id="filtro-precio"
              type="number"
              min="0"
              step="1000"
              placeholder="Sin límite"
              value={filtros.precioMaximo}
              onChange={(evento) => actualizarFiltro('precioMaximo', evento.target.value)}
              aria-invalid={precioNegativo}
            />
            {precioNegativo && (
              <p role="alert">El precio máximo no puede ser negativo.</p>
            )}
          </div>

          <div className="filtros-campo">
            <label htmlFor="filtro-calificacion">Calificación mínima</label>
            <select
              id="filtro-calificacion"
              value={filtros.calificacionMinima}
              onChange={(evento) =>
                actualizarFiltro('calificacionMinima', evento.target.value)
              }
            >
              <option value="">Todas las calificaciones</option>
              <option value="3">3 estrellas o más</option>
              <option value="4">4 estrellas o más</option>
              <option value="4.5">4,5 estrellas o más</option>
            </select>
          </div>
        </div>

        <label className="filtros-disponibilidad">
          <input
            type="checkbox"
            checked={filtros.soloDisponibles}
            onChange={(evento) =>
              actualizarFiltro('soloDisponibles', evento.target.checked)
            }
          />
          Solo prestadores disponibles
        </label>

        <div className="filtros-acciones">
          <button type="button" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>

          <p role="status">
            {resultados.length} {resultados.length === 1 ? 'prestador encontrado' : 'prestadores encontrados'}
          </p>
        </div>
      </div>

      <MapaPrestadores
        prestadores={resultados}
        onSeleccionar={setPrestadorSeleccionadoId}
      />

      {resultados.length === 0 ? (
        <p>No se encontraron prestadores con los criterios seleccionados.</p>
      ) : (
        <ul className="lista-prestadores">
          {resultados.map((prestador) => (
            <li key={prestador.id} className="tarjeta-prestador">
              <h3>
                <button
                  type="button"
                  className="boton-nombre"
                  onClick={() => setPrestadorSeleccionadoId(prestador.id)}
                >
                  {prestador.nombre}
                </button>
              </h3>
              <p>{prestador.oficios.join(', ')}</p>
              <p>{prestador.zonaCobertura}</p>
              <p className="tarjeta-precio">
                ${prestador.precioMin.toLocaleString('es-AR')} – $
                {prestador.precioMax.toLocaleString('es-AR')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
