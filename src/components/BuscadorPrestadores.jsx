import { useEffect, useMemo, useRef, useState } from 'react'
import { listarPrestadores } from '../services/prestadoresService'
import FichaPrestadorRemota from './FichaPrestadorRemota'
import { MapaPrestadores } from './mapa/MapaPrestadores'
import { DetallePrestador } from './DetallePrestador'
import {
  FILTROS_INICIALES,
  aplicarFiltrosPrestadores,
  obtenerOpcionesFiltros,
} from '../utils/filtrosPrestadores'
import '../styles/FiltrosPrestadores.css'

function IconoDirectorio({ tipo }) {
  const trazos = {
    buscar: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
    zona: 'M12 22s8-8 8-14a8 8 0 0 0-16 0c0 6 8 14 8 14ZM15 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    precio: 'm3 3 9 0 9 9-9 9-9-9V3ZM7 7h.01',
    estrella: 'm12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z',
    oficio: 'M14 6a6 6 0 0 0-7 8L2 19a2 2 0 0 0 3 3l6-6a6 6 0 0 0 8-7l-4 4-4-4 4-4Z',
    flecha: 'M4 12h16m-6-6 6 6-6 6',
  }
  return <svg viewBox="0 0 24 24" fill={tipo === 'estrella' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={trazos[tipo]} /></svg>
}

export function BuscadorPrestadores({ prestadores, calificaciones = [], catalogoOficios, marcadoresPublicos }) {
  const [termino, setTermino] = useState('')
  const [filtros, setFiltros] = useState({ ...FILTROS_INICIALES })
  const [prestadorSeleccionadoId, setPrestadorSeleccionadoId] = useState(null)
  const [remotos, setRemotos] = useState(null)
  const [errorRemoto, setErrorRemoto] = useState('')
  const [cargandoRemoto, setCargandoRemoto] = useState(false)
  const resultadosRef = useRef(null)
  const consulta = JSON.stringify({ q: termino.trim(), oficioId: catalogoOficios?.find((oficio) => oficio.nombre === filtros.oficio)?.id, calificacionMin: filtros.calificacionMinima, disponible: filtros.soloDisponibles ? true : undefined })
  useEffect(() => {
    if (!catalogoOficios) return
    let vigente = true
    const temporizador = setTimeout(async () => {
      setCargandoRemoto(true); setErrorRemoto('')
      try {
        const lista = await listarPrestadores(JSON.parse(consulta))
        if (vigente) setRemotos({ consulta, lista })
      } catch (fallo) { if (vigente) setErrorRemoto(fallo.message) }
      finally { if (vigente) setCargandoRemoto(false) }
    }, 300)
    return () => { vigente = false; clearTimeout(temporizador) }
  }, [catalogoOficios, consulta])
  const listaActual = remotos?.consulta === consulta ? remotos.lista : prestadores
  const precioNegativo =
    filtros.precioMaximo !== '' && Number(filtros.precioMaximo) < 0
  const opciones = obtenerOpcionesFiltros(listaActual)
  if (catalogoOficios) opciones.oficios = catalogoOficios.map((oficio) => oficio.nombre)
  const resultados = useMemo(() => aplicarFiltrosPrestadores(listaActual, termino, filtros), [listaActual, termino, filtros])
  const marcadoresVisibles = useMemo(() => {
    if (!marcadoresPublicos) return resultados
    if (!termino && !Object.values(filtros).some(Boolean)) return marcadoresPublicos
    return marcadoresPublicos.filter((marcador) => resultados.some((prestador) => prestador.id === marcador.id))
  }, [marcadoresPublicos, resultados, termino, filtros])

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

  if (prestadorSeleccionadoId !== null && catalogoOficios) {
    return <FichaPrestadorRemota key={prestadorSeleccionadoId} id={prestadorSeleccionadoId} onVolver={() => setPrestadorSeleccionadoId(null)} />
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
      {cargandoRemoto && <p role="status">Actualizando búsqueda...</p>}
      {errorRemoto && <p role="alert">{errorRemoto}</p>}
      <div className="filtros-prestadores">
        <h2>Buscar profesionales</h2>
        <div className="filtros-campo filtros-busqueda">
          <label htmlFor="busqueda">Buscar prestador</label>
          <IconoDirectorio tipo="buscar" />
          <input
            id="busqueda"
            maxLength={100}
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

          <button className="directorio-buscar" type="button" onClick={() => resultadosRef.current?.scrollIntoView?.({ block: 'start' })}>
            <IconoDirectorio tipo="buscar" /> Buscar prestadores
          </button>
        </div>
      </div>

      <MapaPrestadores
        prestadores={marcadoresVisibles}
        onSeleccionar={setPrestadorSeleccionadoId}
      />

      <section className="directorio-resultados" ref={resultadosRef} aria-labelledby="directorio-resultados-titulo">
        <div className="directorio-resultados-cabecera"><h2 id="directorio-resultados-titulo">Prestadores encontrados</h2><p role="status">Mostrando {resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'}</p></div>
      {resultados.length === 0 ? (
        <p>No se encontraron prestadores con los criterios seleccionados.</p>
      ) : (
        <ul className="lista-prestadores">
          {resultados.map((prestador) => (
            <li key={prestador.id} className="tarjeta-prestador">
              <span className="directorio-avatar" aria-hidden="true"><IconoDirectorio tipo="oficio" /></span>
              <div className="directorio-datos">
              <h3>
                <button
                  type="button"
                  className="boton-nombre"
                  aria-label={prestador.nombre}
                  onClick={() => setPrestadorSeleccionadoId(prestador.id)}
                >
                  {prestador.nombre}
                  <span className="directorio-ver-perfil" aria-hidden="true">Ver perfil <IconoDirectorio tipo="flecha" /></span>
                </button>
              </h3>
              <p>{prestador.oficios.join(', ')}</p>
              <div className="directorio-metadatos">
                {prestador.zonaCobertura && <span><IconoDirectorio tipo="zona" />{prestador.zonaCobertura}</span>}
                {Number.isFinite(prestador.calificacionPromedio) && <span className="directorio-calificacion"><IconoDirectorio tipo="estrella" />{prestador.calificacionPromedio.toFixed(1)}{Number.isFinite(prestador.reputacion?.totalCalificaciones) && ` (${prestador.reputacion.totalCalificaciones})`}</span>}
                {Number.isFinite(prestador.precioMin) ? <span><IconoDirectorio tipo="precio" />Desde $ {prestador.precioMin.toLocaleString('es-AR')}</span> : Number.isFinite(prestador.precioMax) && <span><IconoDirectorio tipo="precio" />Hasta $ {prestador.precioMax.toLocaleString('es-AR')}</span>}
              </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      </section>
    </section>
  )
}
