import { generarEstrellas, obtenerCalificacionesVisibles } from '../utils/reputacion'

export function ReputacionPrestador({ prestador, calificaciones }) {
  const visibles = obtenerCalificacionesVisibles(calificaciones, prestador.id)

  return (
    <section className="reputacion">
      <h3>Reputación</h3>

      {prestador.calificacionPromedio === null ? (
        <p>Sin calificaciones</p>
      ) : (
        <>
          <p className="estrellas" aria-hidden="true">
            {generarEstrellas(prestador.calificacionPromedio)}
          </p>
          <p>Calificación: {prestador.calificacionPromedio.toFixed(1)} / 5</p>
        </>
      )}
      <p>Trabajos finalizados: {prestador.trabajosFinalizados}</p>

      <h4>Comentarios</h4>
      {visibles.length === 0 ? (
        <p>Todavía no hay comentarios</p>
      ) : (
        <ul className="lista-comentarios">
          {visibles.map((calificacion) => (
            <li key={calificacion.id} className="comentario">
              <p>
                <strong>{calificacion.clienteNombre}</strong> –{' '}
                <span className="estrellas">{generarEstrellas(calificacion.puntaje)}</span>
              </p>
              {calificacion.comentario && <p>{calificacion.comentario}</p>}
              <p className="comentario-fecha">
                {new Date(calificacion.fechaPublicacion).toLocaleDateString('es-AR')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
