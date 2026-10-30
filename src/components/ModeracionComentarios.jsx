import { useState } from 'react'
import { IconoAdministracion } from './IconoAdministracion'

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
      <section className="admin-tarjeta admin-publicados" aria-labelledby="admin-publicados-titulo">
      <header className="admin-seccion-cabecera">
        <span className="admin-icono-circulo"><IconoAdministracion /></span>
        <div><h3 id="admin-publicados-titulo">Comentarios publicados</h3><p>Revisá los comentarios dejados por los usuarios.</p></div>
        <span className="admin-contador"><IconoAdministracion />Total: {publicadas.length}</span>
      </header>
      {publicadas.length === 0 ? (
        <p>No hay comentarios para moderar</p>
      ) : (
        <ul className="lista-moderacion">
          {publicadas.map((calificacion) => (
            <li key={calificacion.id} className="tarjeta-moderacion">
              <span className="admin-avatar"><IconoAdministracion tipo="usuario" /></span>
              <div className="admin-comentario-datos">
                <strong>{nombreCliente(calificacion)}</strong>
                <p className="admin-prestador">sobre {nombrePrestador(calificacion.prestadorId)}</p>
                <p className="admin-puntaje"><IconoAdministracion tipo="estrella" />{calificacion.puntaje}/5</p>
              </div>
              <p className="admin-comentario-texto">{calificacion.comentario ?? 'Sin comentario'}</p>

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
                  <IconoAdministracion tipo="oculto" />Ocultar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      </section>
      <section className="admin-tarjeta admin-ocultos" aria-labelledby="admin-ocultos-titulo">
      <header className="admin-seccion-cabecera">
        <span className="admin-icono-circulo"><IconoAdministracion tipo="oculto" /></span>
        <div><h3 id="admin-ocultos-titulo">Comentarios ocultos</h3><p>Comentarios que fueron ocultos y no se muestran públicamente.</p></div>
        <span className="admin-contador admin-contador-neutro"><IconoAdministracion tipo="oculto" />Total: {ocultas.length}</span>
      </header>
      {ocultas.length === 0 ? (
        <p>No hay comentarios ocultos</p>
      ) : (
        <ul className="lista-moderacion">
          {ocultas.map((calificacion) => (
            <li key={calificacion.id} className="tarjeta-moderacion tarjeta-oculta">
              <span className="admin-avatar"><IconoAdministracion tipo="usuario" /></span>
              <div className="admin-comentario-datos"><strong>{nombreCliente(calificacion)}</strong><p className="admin-prestador">sobre {nombrePrestador(calificacion.prestadorId)}</p></div>
              <p className="admin-comentario-texto">Motivo: {calificacion.motivoModeracion ?? 'Sin motivo registrado'}</p>
            </li>
          ))}
        </ul>
      )}
      </section>
    </section>
  )
}
