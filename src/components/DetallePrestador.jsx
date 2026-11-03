import { useState } from 'react'
import { ReputacionPrestador } from './ReputacionPrestador'
import { FormularioSolicitud } from './FormularioSolicitud'
import { FotoPrestador } from './prestador/FotoPrestador'
import { obtenerIniciales } from '../utils/perfilUsuario'
import { IconoPrestador } from './prestador/IconoPrestador'
import { DistanciaPrestador } from './DistanciaPrestador'
import { obtenerEnlaceWhatsApp } from '../utils/whatsapp'

export function DetallePrestador({ prestador, calificaciones = [], onVolver, referencia }) {
  const [mostrandoSolicitud, setMostrandoSolicitud] = useState(false)
  const enlaceWhatsApp = obtenerEnlaceWhatsApp(prestador.whatsapp)

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

      <h2><span className="detalle-avatar" aria-hidden="true"><FotoPrestador key={`${prestador.id}:${prestador.fotoPerfil}`} prestador={prestador} respaldo={obtenerIniciales(prestador.nombre) || <IconoPrestador tipo="usuario" />} /></span>{prestador.nombre}</h2>
      <p>{prestador.descripcionProfesional}</p>

      <div className="detalle-datos">
        <p>Oficios: {prestador.oficios.join(', ')}</p>
        <p>Zona: {prestador.zonaCobertura}</p>
        <DistanciaPrestador referencia={referencia} prestador={prestador} />
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
        {prestador.whatsapp && <li>
          {enlaceWhatsApp ? <a href={enlaceWhatsApp}>WhatsApp</a> : <>
            <span>WhatsApp: {prestador.whatsapp}</span>
            <p>Enlace no disponible. El número debe tener formato internacional con + y código de país.</p>
          </>}
        </li>}
        <li hidden={!prestador.emailContacto}>
          <a href={`mailto:${prestador.emailContacto}`}>{prestador.emailContacto}</a>
        </li>
      </ul>
    </article>
  )
}
