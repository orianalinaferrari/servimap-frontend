import { useId, useState } from 'react'
import { errorConsulta, validarRespuesta } from '../../utils/consultasAyuda'

export default function RespuestaConsulta({ onResponder, ocupado }) {
  const id = useId()
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  async function enviar(evento) {
    evento.preventDefault()
    if (ocupado) return
    if (!validarRespuesta(mensaje)) { setError('La respuesta debe tener entre 1 y 2000 caracteres.'); return }
    setError('')
    try { await onResponder(mensaje.trim()); setMensaje('') }
    catch (fallo) { setError(errorConsulta(fallo)) }
  }
  return <form onSubmit={enviar} aria-label="Responder consulta" aria-busy={ocupado}>
    <label htmlFor={id}>Respuesta del administrador</label>
    <textarea id={id} value={mensaje} onChange={e => setMensaje(e.target.value)} maxLength={2000} disabled={ocupado} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
    {error && <p role="alert" id={`${id}-error`}>{error}</p>}
    <button type="submit" disabled={ocupado}>{ocupado ? 'Guardando respuesta...' : 'Enviar respuesta'}</button>
  </form>
}
