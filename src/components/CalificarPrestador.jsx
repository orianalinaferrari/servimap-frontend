import { useState } from 'react'
import { IconoPrestador as IconoCliente } from './prestador/IconoPrestador'
import {
  puedeCalificarSolicitud,
  validarCalificacion,
} from '../utils/calificacionSolicitud'
import '../styles/CalificarPrestador.css'

export default function CalificarPrestador({
  solicitud,
  onEnviar,
  onCancelar,
  enviando = false,
}) {
  const [puntaje, setPuntaje] = useState(0)
  const [comentario, setComentario] = useState('')
  const [error, setError] = useState('')

  if (!puedeCalificarSolicitud(solicitud)) {
    return null
  }

  function enviar(evento) {
    evento.preventDefault()

    if (enviando) {
      return
    }

    try {
      const datos = validarCalificacion({
        puntaje,
        comentario,
      })

      setError('')
      onEnviar(datos)
    } catch (errorValidacion) {
      setError(errorValidacion.message)
    }
  }

  return (
    <form
      className="calificar-prestador"
      onSubmit={enviar}
    >
      <h3>Calificar al prestador</h3>

      <p>¿Cómo fue tu experiencia con el servicio?</p>

      <fieldset disabled={enviando}>
        <legend>Puntuación obligatoria</legend>

        <div className="calificar-prestador-estrellas">
          {[1, 2, 3, 4, 5].map((valor) => (
            <label key={valor}>
              <input
                type="radio"
                aria-label={`${valor} ${valor === 1 ? 'estrella' : 'estrellas'}`}
                name={`puntaje-${solicitud.id}`}
                value={valor}
                checked={puntaje === valor}
                onChange={() => setPuntaje(valor)}
              />
              <span className={valor <= puntaje ? 'seleccionada' : ''} aria-hidden="true">{valor}<IconoCliente tipo="estrella" /></span>
            </label>
          ))}
        </div>
      </fieldset>

      <label htmlFor={`comentario-${solicitud.id}`}>
        Comentario (opcional)
      </label>

      <textarea
        id={`comentario-${solicitud.id}`}
        value={comentario}
        disabled={enviando}
        onChange={(evento) =>
          setComentario(evento.target.value)
        }
        rows={4}
        maxLength={500}
        placeholder="Contanos cómo fue el trabajo realizado"
      />

      {error && <p role="alert">{error}</p>}

      <div className="calificar-prestador-acciones">
        <button type="submit" disabled={enviando}>
          {enviando ? 'Enviando...' : 'Enviar calificación'}
        </button>

        <button
          type="button"
          disabled={enviando}
          onClick={onCancelar}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
