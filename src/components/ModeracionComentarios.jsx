import { useState } from 'react'

export function ModeracionComentarios({ prestadores, calificaciones, onModerar }) {
  const [seleccionadaId, setSeleccionadaId] = useState(null)
  const [motivo, setMotivo] = useState('')

  const publicadas = calificaciones.filter((calificacion) => !calificacion.moderada)
  const ocultas = calificaciones.filter((calificacion) => calificacion.moderada)

  function nombrePrestador(prestadorId) {
    const prestador = prestadores.find((p) => p.id === prestadorId)
    return prestador ? prestador.nombre : 'Prestador desconocido'
  }

  function cancelar() {
    setSeleccionadaId(null)
    setMotivo('')
  }

  function confirmar(evento) {
    evento.preventDefault()
    if (motivo.trim() === '') return
    onModerar(seleccionadaId, motivo.trim())
    cancelar()
  }

  return (
    <section className="moderacion">
      <h3>Comentarios publicados</h3>
      {publicadas.length === 0 ? (
        <p>No hay comentarios para moderar</p>
      ) : (
        <ul className="lista-moderacion">
          {publicadas.map((calificacion) => (
            <li key={calificacion.id} className="tarjeta-moderacion">
              <p>
                <strong>{calificacion.clienteNombre}</strong> sobre{' '}
                {nombrePrestador(calificacion.prestadorId)} – {calificacion.puntaje}/5
              </p>
              <p>{calificacion.comentario ?? 'Sin comentario'}</p>

              {seleccionadaId === calificacion.id ? (
                <form className="form-moderacion" onSubmit={confirmar}>
                  <label htmlFor={`motivo-${calificacion.id}`}>Motivo de la moderación</label>
                  <input
                    id={`motivo-${calificacion.id}`}
                    type="text"
                    value={motivo}
                    onChange={(evento) => setMotivo(evento.target.value)}
                  />
                  <div className="form-moderacion-botones">
                    <button
                      type="submit"
                      className="boton-confirmar"
                      disabled={motivo.trim() === ''}
                    >
                      Confirmar
                    </button>
                    <button type="button" className="boton-cancelar" onClick={cancelar}>
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  className="boton-ocultar"
                  aria-label={`Ocultar comentario de ${calificacion.clienteNombre}`}
                  onClick={() => setSeleccionadaId(calificacion.id)}
                >
                  Ocultar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <h3>Comentarios ocultos</h3>
      {ocultas.length === 0 ? (
        <p>No hay comentarios ocultos</p>
      ) : (
        <ul className="lista-moderacion">
          {ocultas.map((calificacion) => (
            <li key={calificacion.id} className="tarjeta-moderacion tarjeta-oculta">
              <p>
                <strong>{calificacion.clienteNombre}</strong> sobre{' '}
                {nombrePrestador(calificacion.prestadorId)}
              </p>
              <p>Motivo: {calificacion.motivoModeracion ?? 'Sin motivo registrado'}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}