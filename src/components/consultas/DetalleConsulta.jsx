import { useState } from 'react'
import { CATEGORIAS_CONSULTA, ESTADOS_CONSULTA, errorConsulta } from '../../utils/consultasAyuda'
import { formatearFechaArgentina } from '../../utils/fechas'
import RespuestaConsulta from './RespuestaConsulta'

export default function DetalleConsulta({ consulta, administracion, onResponder, onCerrar, onVolver, ocupado }) {
  const [confirmar, setConfirmar] = useState(false)
  const [error, setError] = useState('')
  async function cerrar() {
    if (ocupado) return
    setError('')
    try { await onCerrar(); setConfirmar(false) }
    catch (fallo) { setError(errorConsulta(fallo)) }
  }
  return <section className="consultas-tarjeta" aria-label="Detalle de consulta">
    <button type="button" onClick={onVolver} disabled={ocupado}>Volver al historial</button>
    <h3>{consulta.asunto}</h3>
    <p>{CATEGORIAS_CONSULTA[consulta.categoria]} · {ESTADOS_CONSULTA[consulta.estado]}</p>
    <p>Fecha: <time dateTime={consulta.fechaCreacion}>{formatearFechaArgentina(consulta.fechaCreacion)}</time></p>
    <p className="consultas-mensaje">{consulta.mensaje}</p>
    {consulta.respuesta ? <section aria-label="Respuesta del administrador"><h4>Respuesta del administrador</h4><p className="consultas-mensaje">{consulta.respuesta.mensaje}</p><time dateTime={consulta.respuesta.fechaCreacion}>{formatearFechaArgentina(consulta.respuesta.fechaCreacion)}</time></section> : <p>Esta consulta todavía no tiene respuesta.</p>}
    {administracion && consulta.estado === 'PENDIENTE' && <RespuestaConsulta onResponder={onResponder} ocupado={ocupado} />}
    {administracion && consulta.estado !== 'CERRADA' && (confirmar ? <div role="group" aria-label="Confirmar cierre de consulta"><p>La consulta quedará cerrada y no admitirá nuevas respuestas.</p><button type="button" onClick={cerrar} disabled={ocupado}>Confirmar cierre</button><button type="button" onClick={() => setConfirmar(false)} disabled={ocupado}>Volver sin cerrar</button></div> : <button type="button" onClick={() => setConfirmar(true)} disabled={ocupado}>Preparar cierre</button>)}
    {error && <p role="alert">{error}</p>}
  </section>
}
