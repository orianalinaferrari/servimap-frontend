import { generarEstrellas, obtenerCalificacionesVisibles } from '../utils/reputacion'

export function ReputacionPrestador({ prestador, calificaciones }) {
  const visibles = obtenerCalificacionesVisibles(calificaciones, prestador.id)

  return (
    <section>
      <h3>Reputación</h3>

      {prestador.calificacionPromedio === null ? (
        <p>Sin calificaciones</p>
      ) : (
        <>
          <p aria-hidden="true">{generarEstrellas(prestador.calificacionPromedio)}</p>
          <p>Calificación: {prestador.calificacionPromedio.toFixed(1)} / 5</p>
        </>
      )}
      <p>Trabajos finalizados: {prestador.trabajosFinalizados}</p>

      <h4>Comentarios</h4>
      {visibles.length === 0 ? (
        <p>Todavía no hay comentarios</p>
      ) : (
        <ul>
          {visibles.map((calificacion) => (
            <li key={calificacion.id}>
              <p>
                <strong>{calificacion.clienteNombre}</strong> –{' '}
                {generarEstrellas(calificacion.puntaje)}
              </p>
              {calificacion.comentario && <p>{calificacion.comentario}</p>}
              <p>{calificacion.fechaPublicacion.split('-').reverse().join('/')}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
