import { useId } from 'react'
import { ESTADOS_CONSULTA } from '../../utils/consultasAyuda'
import { formatearFechaArgentina } from '../../utils/fechas'

export default function ListaConsultas({ resultado, estado, onEstado, onPagina, onAbrir, ocupado }) {
  const id = useId()
  return <section className="consultas-tarjeta" aria-label="Historial de consultas">
    <h3>Historial de consultas</h3>
    <label htmlFor={id}>Filtrar consultas por estado</label>
    <select id={id} value={estado} onChange={e => onEstado(e.target.value)} disabled={ocupado}>
      <option value="">Todos los estados</option>
      {Object.entries(ESTADOS_CONSULTA).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
    </select>
    {resultado.datos.length === 0 ? <p>No hay consultas para mostrar.</p> : <ul className="consultas-lista">{resultado.datos.map(consulta => <li key={consulta.id}>
      <h4>{consulta.asunto}</h4><p>{ESTADOS_CONSULTA[consulta.estado]} · <time dateTime={consulta.fechaCreacion}>{formatearFechaArgentina(consulta.fechaCreacion)}</time></p>
      <button type="button" onClick={() => onAbrir(consulta.id)} disabled={ocupado} aria-label={`Ver consulta: ${consulta.asunto}`}>Ver detalle</button>
    </li>)}</ul>}
    <nav className="consultas-acciones" aria-label="Páginas de consultas">
      <button type="button" onClick={() => onPagina(resultado.pagina - 1)} disabled={ocupado || resultado.pagina <= 1}>Anterior</button>
      <p role="status">Página {resultado.pagina} de {resultado.totalPaginas} · {resultado.total} consultas</p>
      <button type="button" onClick={() => onPagina(resultado.pagina + 1)} disabled={ocupado || resultado.pagina >= resultado.totalPaginas}>Siguiente</button>
    </nav>
  </section>
}
