import { useState } from 'react'
import { ReputacionPrestador } from './ReputacionPrestador'
import { FormularioSolicitud } from './FormularioSolicitud'

export function DetallePrestador({ prestador, calificaciones = [], onVolver }) {
  const [mostrandoSolicitud, setMostrandoSolicitud] = useState(false)

  if (mostrandoSolicitud) {
    return (
      <FormularioSolicitud
        prestador={prestador}
        onCancelar={() => setMostrandoSolicitud(false)}
      />
    )
  }

  return (
    <article className="detalle">
      <button type="button" className="boton-volver" onClick={onVolver}>
        Volver
      </button>

      <h2>{prestador.nombre}</h2>
      <p>{prestador.descripcionProfesional}</p>

      <div className="detalle-datos">
        <p>Oficios: {prestador.oficios.join(', ')}</p>
        <p>Zona: {prestador.zonaCobertura}</p>
        <p>
          Precio: ${(prestador.precioMin?.toLocaleString('es-AR') ?? '—')} – $
          {(prestador.precioMax?.toLocaleString('es-AR') ?? '—')}
        </p>
        <p className={prestador.disponible ? 'estado-disponible' : 'estado-no-disponible'}>
          {prestador.disponible ? 'Disponible' : 'No disponible'}
        </p>

        <button
          type="button"
          className="boton-solicitar"
          onClick={() => setMostrandoSolicitud(true)}
          disabled={!prestador.disponible}
        >
          Solicitar servicio
        </button>
      </div>

      <ReputacionPrestador prestador={prestador} calificaciones={calificaciones} />

      <h3>Contacto</h3>
      <ul className="contacto-lista">
        <li hidden={!prestador.telefono}>
          <a href={`tel:${prestador.telefono}`}>{prestador.telefono}</a>
        </li>
        <li hidden={!prestador.whatsapp}>
          <a href={`https://wa.me/${prestador.whatsapp}`}>WhatsApp</a>
        </li>
        <li hidden={!prestador.emailContacto}>
          <a href={`mailto:${prestador.emailContacto}`}>{prestador.emailContacto}</a>
        </li>
      </ul>
    </article>
  )
}