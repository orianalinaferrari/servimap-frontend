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
    <article>
      <button type="button" onClick={onVolver}>
        Volver
      </button>

      <h2>{prestador.nombre}</h2>
      <p>{prestador.descripcionProfesional}</p>

      <p>Oficios: {prestador.oficios.join(', ')}</p>
      <p>Zona: {prestador.zonaCobertura}</p>
      <p>
        Precio: ${prestador.precioMin.toLocaleString('es-AR')} – $
        {prestador.precioMax.toLocaleString('es-AR')}
      </p>

      <p>{prestador.disponible ? 'Disponible' : 'No disponible'}</p>

      <button
        type="button"
        onClick={() => setMostrandoSolicitud(true)}
        disabled={!prestador.disponible}
      >
        Solicitar servicio
      </button>

      <ReputacionPrestador prestador={prestador} calificaciones={calificaciones} />

      <h3>Contacto</h3>
      <ul>
        <li>
          <a href={`tel:${prestador.telefono}`}>{prestador.telefono}</a>
        </li>
        <li>
          <a href={`https://wa.me/${prestador.whatsapp}`}>WhatsApp</a>
        </li>
        <li>
          <a href={`mailto:${prestador.emailContacto}`}>{prestador.emailContacto}</a>
        </li>
      </ul>
    </article>
  )
}
