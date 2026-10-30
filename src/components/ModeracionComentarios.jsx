import { useState } from 'react'

export function ModeracionComentarios({ prestadores, calificaciones, onModerar }) {
  const [seleccionadaId, setSeleccionadaId] = useState(null)
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const publicadas = calificaciones.filter((calificacion) => !calificacion.moderada)
  const ocultas = calificaciones.filter((calificacion) => calificacion.moderada)
  const nombreCliente = (calificacion) => calificacion.clienteNombre || `Cliente ${calificacion.clienteId}`

  function nombrePrestador(prestadorId) {
    const prestador = prestadores.find((p) => p.id === prestadorId)
    return prestador ? prestador.nombre : `Prestador ${prestadorId}`
  }

  function cancelar() {
    setSeleccionadaId(null)
    setMotivo('')
  }

  async function confirmar(evento) {
    evento.preventDefault()
    if (enviando || motivo.trim() === '') return
    setEnviando(true); setError('')
    try { await onModerar(seleccionadaId, motivo.trim()); cancelar() }
    catch (fallo) { setError(fallo.message) }
    finally { setEnviando(false) }
  }

  return (
    <section className="moderacion">
      {error && <p role="alert">{error}</p>}
      <h3>Comentarios publicados</h3>
      {publicadas.length === 0 ? (
        <p>No hay comentarios para moderar</p>
      ) : (
        <ul className="lista-moderacion">
          {publicadas.map((calificacion) => (
            <li key={calificacion.id} className="tarjeta-moderacion">
              <p>
                <strong>{nombreCliente(calificacion)}</strong> sobre{' '}
                {nombrePrestador(calificacion.prestadorId)} – {calificacion.puntaje}/5
              </p>
              <p>{calificacion.comentario ?? 'Sin comentario'}</p>

              {seleccionadaId === calificacion.id ? (
                <form className="form-moderacion" onSubmit={confirmar}>
                  <label htmlFor={`motivo-${calificacion.id}`}>Motivo de la moderación</label>
                    <input
                      maxLength={200}
                    id={`motivo-${calificacion.id}`}
                    type="text"
                    value={motivo}
                    onChange={(evento) => setMotivo(evento.target.value)}
                  />
                  <div className="form-moderacion-botones">
                    <button
                      type="submit"
                      className="boton-confirmar"
                      disabled={enviando || motivo.trim() === ''}
                    >
                      Confirmar
                    </button>
                    <button type="button" className="boton-cancelar" onClick={cancelar} disabled={enviando}>
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  className="boton-ocultar"
                  aria-label={`Ocultar comentario de ${nombreCliente(calificacion)}`}
                  disabled={enviando}
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
                <strong>{nombreCliente(calificacion)}</strong> sobre{' '}
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
