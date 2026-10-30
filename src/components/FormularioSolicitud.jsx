import { useState } from 'react'
import { useAuth } from '../context/useAuth'
import { ROLES } from '../utils/roles'
import {
  SOLICITUD_INICIAL,
  validarSolicitud,
  construirSolicitud,
} from '../utils/solicitudes'
import { crearSolicitud } from '../services/solicitudesService'
import '../styles/CrearSolicitud.css'

export function FormularioSolicitud({ prestador, onCancelar }) {
  const { usuario } = useAuth()
  const [datos, setDatos] = useState({ ...SOLICITUD_INICIAL })
  const [errores, setErrores] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)

  const esCliente = usuario?.rol === ROLES.CLIENTE

  function actualizarCampo(campo, valor) {
    setDatos((anteriores) => ({
      ...anteriores,
      [campo]: valor,
    }))

    setErrores((anteriores) => ({
      ...anteriores,
      [campo]: undefined,
    }))

    setResultado(null)
  }

  async function enviar(evento) {
    evento.preventDefault()

    if (enviando) return

    setResultado(null)

    if (!esCliente) {
      setResultado({
        tipo: 'error',
        mensaje: 'Debés iniciar sesión como cliente para crear una solicitud.',
      })
      return
    }

    const erroresEncontrados = validarSolicitud(datos, prestador)
    setErrores(erroresEncontrados)

    if (Object.keys(erroresEncontrados).length > 0) {
      return
    }

    setEnviando(true)

    try {
      await crearSolicitud(construirSolicitud(datos, prestador))

      setResultado({
        tipo: 'exito',
        mensaje: 'Tu solicitud fue enviada correctamente.',
      })

      setDatos({ ...SOLICITUD_INICIAL })
      setErrores({})
    } catch (error) {
      setResultado({
        tipo: 'error',
        mensaje: error instanceof Error
          ? error.message
          : 'No se pudo enviar la solicitud.',
      })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className={`crear-solicitud${esCliente ? ' cliente-formulario-solicitud' : ''}`}>
      <button
        type="button"
        className="crear-solicitud-volver"
        onClick={onCancelar}
      >
        Volver al prestador
      </button>

      <h2>Crear solicitud de servicio</h2>
      <p>
        Prestador seleccionado: <strong>{prestador?.nombre || 'No seleccionado'}</strong>
      </p>

      {!esCliente && (
        <p role="alert">
          Para enviar una solicitud, debés iniciar sesión con una cuenta de cliente.
        </p>
      )}

      {resultado && (
        <p
          role={resultado.tipo === 'error' ? 'alert' : 'status'}
          className={`crear-solicitud-mensaje crear-solicitud-${resultado.tipo}`}
        >
          {resultado.mensaje}
        </p>
      )}

      <form onSubmit={enviar} noValidate>
        <div className="crear-solicitud-campo cliente-campo-completo">
          <label htmlFor="solicitud-servicio">Servicio *</label>
          <select
            id="solicitud-servicio"
            value={datos.servicio}
            onChange={(evento) => actualizarCampo('servicio', evento.target.value)}
            aria-invalid={Boolean(errores.servicio)}
            aria-describedby={errores.servicio ? 'error-servicio' : undefined}
          >
            <option value="">Seleccioná un servicio</option>
            {(prestador?.oficios || []).map((oficio) => (
              <option key={oficio} value={oficio}>
                {oficio}
              </option>
            ))}
          </select>
          {errores.servicio && (
            <p id="error-servicio" className="crear-solicitud-error">
              {errores.servicio}
            </p>
          )}
        </div>

        <div className="crear-solicitud-campo cliente-campo-completo">
          <label htmlFor="solicitud-descripcion">Descripción del trabajo *</label>
          <textarea
            id="solicitud-descripcion"
            rows="5"
            maxLength={1000}
            value={datos.descripcion}
            onChange={(evento) => actualizarCampo('descripcion', evento.target.value)}
            placeholder="Describí qué trabajo necesitás realizar"
            aria-invalid={Boolean(errores.descripcion)}
            aria-describedby={errores.descripcion ? 'error-descripcion' : undefined}
          />
          {errores.descripcion && (
            <p id="error-descripcion" className="crear-solicitud-error">
              {errores.descripcion}
            </p>
          )}
        </div>

        <div className="crear-solicitud-campo">
          <label htmlFor="solicitud-direccion">Dirección del servicio (opcional)</label>
          <input
            id="solicitud-direccion"
            type="text"
            maxLength={200}
            value={datos.direccion}
            onChange={(evento) => actualizarCampo('direccion', evento.target.value)}
            placeholder="Calle, número y localidad"
            aria-invalid={Boolean(errores.direccion)}
            aria-describedby={errores.direccion ? 'error-direccion' : undefined}
          />
          {errores.direccion && (
            <p id="error-direccion" className="crear-solicitud-error">
              {errores.direccion}
            </p>
          )}
        </div>

        <div className="crear-solicitud-campo">
          <label htmlFor="solicitud-contacto">Contacto preferido (opcional)</label>
          <input id="solicitud-contacto" value={datos.contactoPreferido} onChange={(evento) => actualizarCampo('contactoPreferido', evento.target.value)} placeholder="WhatsApp, email o teléfono" />
        </div>

        <div className="crear-solicitud-acciones">
          <button type="submit" disabled={enviando || !esCliente}>
            {enviando ? 'Enviando solicitud...' : 'Enviar solicitud'}
          </button>
          <button type="button" onClick={onCancelar} disabled={enviando}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  )
}
