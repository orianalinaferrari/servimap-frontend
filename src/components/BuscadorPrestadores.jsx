import { useEffect, useMemo, useRef, useState } from 'react'
import { listarPrestadores } from '../services/prestadoresService'
import FichaPrestadorRemota from './FichaPrestadorRemota'
import { MapaPrestadores } from './mapa/MapaPrestadores'
import { DetallePrestador } from './DetallePrestador'
import { FotoPrestador } from './prestador/FotoPrestador'
import { DistanciaPrestador } from './DistanciaPrestador'
import {
  FILTROS_INICIALES,
  aplicarFiltrosPrestadores,
  obtenerOpcionesFiltros,
} from '../utils/filtrosPrestadores'
import '../styles/FiltrosPrestadores.css'

const SIN_REGISTROS = []

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

export function BuscadorPrestadores({ prestadores, paginaInicial, calificaciones = [], catalogoOficios, marcadoresPublicos }) {
  const [termino, setTermino] = useState('')
  const [filtros, setFiltros] = useState({ ...FILTROS_INICIALES })
  const [ubicacionReferencia, setUbicacionReferencia] = useState(null)
  const [prestadorSeleccionadoId, setPrestadorSeleccionadoId] = useState(null)
  const [remotos, setRemotos] = useState(null)
  const [errorRemoto, setErrorRemoto] = useState('')
  const [consultaCargando, setConsultaCargando] = useState(null)
  const [pagina, setPagina] = useState(1)
  const [revision, setRevision] = useState(0)
  const [consultaFallida, setConsultaFallida] = useState(null)
  const resultadosRef = useRef(null)
  const consulta = JSON.stringify({ page: pagina, q: termino.trim(), oficioId: catalogoOficios?.find((oficio) => oficio.nombre === filtros.oficio)?.id, calificacionMin: filtros.calificacionMinima, disponible: filtros.soloDisponibles ? true : undefined })
  const consultaInicial = pagina === 1 && !termino.trim() && !filtros.oficio && !filtros.calificacionMinima && !filtros.soloDisponibles
  const usarInicial = Boolean(paginaInicial && !remotos && revision === 0 && consultaInicial)
  const paginaActual = remotos?.consulta === consulta ? remotos.resultado : usarInicial ? paginaInicial : null
  const metadatos = paginaActual ?? remotos?.resultado ?? paginaInicial
  const pendiente = Boolean(catalogoOficios && !paginaActual && consultaFallida !== consulta)
  useEffect(() => {
    if (!catalogoOficios || usarInicial) return
    let vigente = true
    const temporizador = setTimeout(async () => {
      setConsultaCargando(consulta); setErrorRemoto('')
      try {
        const lista = await listarPrestadores(JSON.parse(consulta))
        if (vigente) { setRemotos({ consulta, resultado: lista }); setConsultaFallida(null) }
      } catch (fallo) { if (vigente) { setErrorRemoto(fallo.message); setConsultaFallida(consulta) } }
      finally { if (vigente) setConsultaCargando(null) }
    }, 300)
    return () => { vigente = false; clearTimeout(temporizador) }
  }, [catalogoOficios, consulta, revision, usarInicial])
  const listaActual = paginaActual?.registros ?? (metadatos?.paginada ? SIN_REGISTROS : prestadores)
  const precioNegativo =
    filtros.precioMaximo !== '' && Number(filtros.precioMaximo) < 0
  const opciones = obtenerOpcionesFiltros([...prestadores, ...listaActual])
  if (filtros.zona && !opciones.zonas.includes(filtros.zona)) opciones.zonas.push(filtros.zona)
  if (catalogoOficios) opciones.oficios = catalogoOficios.map((oficio) => oficio.nombre)
  const resultados = useMemo(() => aplicarFiltrosPrestadores(listaActual, paginaActual?.paginada ? '' : termino,
    paginaActual?.paginada ? { zona: filtros.zona, precioMaximo: filtros.precioMaximo } : filtros), [listaActual, termino, filtros, paginaActual])
  // /mapa sigue siendo independiente: no se conocen sus filtros globales.
  const marcadoresVisibles = marcadoresPublicos ?? resultados
  const filtrosLocales = Boolean(filtros.zona || filtros.precioMaximo !== '')
  const cargando = consultaCargando === consulta || pendiente
  const errorActual = consultaFallida === consulta ? errorRemoto : ''

  const prestadorSeleccionado = prestadores.find(
    (prestador) => prestador.id === prestadorSeleccionadoId
  )

  function actualizarFiltro(nombre, valor) {
    setPagina(1)
    setFiltros((anteriores) => ({
      ...anteriores,
      [nombre]: valor,
    }))
  }

  function limpiarFiltros() {
    setPagina(1)
    setTermino('')
    setFiltros({ ...FILTROS_INICIALES })
  }

  if (prestadorSeleccionadoId !== null && catalogoOficios) {
    return <FichaPrestadorRemota key={prestadorSeleccionadoId} id={prestadorSeleccionadoId} referencia={ubicacionReferencia} onVolver={() => setPrestadorSeleccionadoId(null)} />
  }
  if (prestadorSeleccionado) {
    return (
      <DetallePrestador
        prestador={prestadorSeleccionado}
        calificaciones={calificaciones}
        referencia={ubicacionReferencia}
        onVolver={() => setPrestadorSeleccionadoId(null)}
      />
    )
  }

  return (
    <section className="buscador-prestadores">
      {cargando && <p role="status">Actualizando búsqueda...</p>}
      {errorActual && <div role="alert"><p>{errorActual}</p><button type="button" onClick={() => { setConsultaFallida(null); setRevision(valor => valor + 1) }}>Reintentar búsqueda</button></div>}
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
            onChange={(evento) => { setPagina(1); setTermino(evento.target.value) }}
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

      {marcadoresPublicos && <p className="directorio-aclaracion" role="note">El mapa es independiente de la página y muestra las ubicaciones públicas recibidas. Por ahora no refleja los filtros del listado; su alcance y filtros están pendientes de confirmación.</p>}
      <MapaPrestadores
        prestadores={marcadoresVisibles}
        onSeleccionar={setPrestadorSeleccionadoId}
        ubicacionReferencia={ubicacionReferencia}
        onCambiarUbicacionReferencia={setUbicacionReferencia}
      />

      <section className="directorio-resultados" ref={resultadosRef} aria-labelledby="directorio-resultados-titulo">
        <div className="directorio-resultados-cabecera"><h2 id="directorio-resultados-titulo">Prestadores encontrados</h2><p role="status">Mostrando {resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'}</p></div>
        {catalogoOficios && <p className="directorio-aclaracion">Zona y precio máximo se aplican solo a los registros de la página recibida. Puede haber coincidencias en otras páginas. Las zonas disponibles provienen de los registros recibidos.</p>}
        {metadatos?.paginada ? <>
          <p>Total informado por el servidor{paginaActual ? '' : ' en la última consulta confirmada'}: {metadatos.totalRegistros}{filtrosLocales ? ' (sin aplicar zona ni precio máximo).' : '.'}</p>
          {metadatos.totalPaginas === 0 ? <p>No hay páginas de resultados.</p> : <nav className="directorio-paginacion" aria-label="Paginación de prestadores">
            <button type="button" disabled={cargando || Boolean(errorActual) || pagina <= 1} onClick={() => setPagina(valor => valor - 1)}>Anterior</button>
            <span aria-live="polite">Página {metadatos.pagina} de {metadatos.totalPaginas}{metadatos.pagina > metadatos.totalPaginas ? ' (fuera de rango)' : ''}{paginaActual ? '' : ' · última confirmada'}</span>
            <button type="button" disabled={cargando || Boolean(errorActual) || pagina >= metadatos.totalPaginas} onClick={() => setPagina(valor => valor + 1)}>Siguiente</button>
          </nav>}
          {pagina > 1 && !cargando && (errorActual || paginaActual?.registros.length === 0) && <button type="button" onClick={() => setPagina(1)}>Volver a la primera página</button>}
        </> : paginaActual && <p>Respuesta sin paginación: se muestran los registros recibidos; el total global no está disponible.</p>}
      {resultados.length === 0 ? (
        !cargando && !errorActual && <p>{catalogoOficios && (paginaActual?.paginada || filtrosLocales)
          ? paginaActual?.totalRegistros === 0 ? 'No se encontraron prestadores para los filtros enviados al servidor.' : 'No hay coincidencias en esta página. Puede haber resultados en otras páginas.'
          : 'No se encontraron prestadores con los criterios seleccionados.'}</p>
      ) : (
        <ul className="lista-prestadores">
          {resultados.map((prestador) => (
            <li key={prestador.id} className="tarjeta-prestador">
              <span className="directorio-avatar" aria-hidden="true"><FotoPrestador key={`${prestador.id}:${prestador.fotoPerfil}`} prestador={prestador} respaldo={<IconoDirectorio tipo="oficio" />} /></span>
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
              <DistanciaPrestador referencia={ubicacionReferencia} prestador={prestador} />
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
