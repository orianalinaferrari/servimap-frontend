import { useId, useState } from 'react'
import { CATEGORIAS_CONSULTA, errorConsulta, validarNuevaConsulta } from '../../utils/consultasAyuda'

export default function FormularioConsulta({ onEnviar, habilitado = false }) {
  const id = useId()
  const [datos, setDatos] = useState({ categoria: '', asunto: '', mensaje: '' })
  const [errores, setErrores] = useState({})
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  async function enviar(evento) {
    evento.preventDefault()
    if (!habilitado || enviando) return
    const validaciones = validarNuevaConsulta(datos)
    setErrores(validaciones); setError('')
    if (Object.keys(validaciones).length) return
    setEnviando(true)
    try {
      await onEnviar({ categoria: datos.categoria, asunto: datos.asunto.trim(), mensaje: datos.mensaje.trim() })
      setDatos({ categoria: '', asunto: '', mensaje: '' })
    } catch (fallo) { setError(errorConsulta(fallo)) }
    finally { setEnviando(false) }
  }
  return <form className="consultas-tarjeta" onSubmit={enviar} noValidate aria-label="Nueva consulta" aria-busy={enviando}>
    <h3>Enviar una consulta</h3>
    <p>No incluyas contraseñas, datos de pago ni información sensible. Las consultas no cambian solicitudes ni gestionan cobros o reembolsos. No hay un plazo de respuesta garantizado.</p>
    <fieldset disabled={!habilitado || enviando}>
      <legend>Datos de la consulta</legend>
      <label htmlFor={`${id}-categoria`}>Categoría</label>
      <select id={`${id}-categoria`} value={datos.categoria} onChange={e => setDatos({ ...datos, categoria: e.target.value })} aria-invalid={Boolean(errores.categoria)} aria-describedby={errores.categoria ? `${id}-error-categoria` : undefined}>
        <option value="">Elegí una categoría</option>
        {Object.entries(CATEGORIAS_CONSULTA).map(([valor, nombre]) => <option key={valor} value={valor}>{nombre}</option>)}
      </select>
      {['asunto', 'mensaje'].map(campo => {
        const Campo = campo === 'mensaje' ? 'textarea' : 'input'
        return <div key={campo}>
          <label htmlFor={`${id}-${campo}`}>{campo === 'asunto' ? 'Asunto' : 'Mensaje'}</label>
          <Campo id={`${id}-${campo}`} value={datos[campo]} maxLength={campo === 'asunto' ? 100 : 2000} onChange={e => setDatos({ ...datos, [campo]: e.target.value })} aria-invalid={Boolean(errores[campo])} aria-describedby={errores[campo] ? `${id}-error-${campo}` : undefined} />
        </div>
      })}
      {Object.entries(errores).map(([campo, mensaje]) => <p role="alert" id={`${id}-error-${campo}`} key={campo}>{mensaje}</p>)}
      <button type="submit">{enviando ? 'Enviando consulta...' : 'Enviar consulta'}</button>
    </fieldset>
    {error && <p role="alert">{error}</p>}
  </form>
}
