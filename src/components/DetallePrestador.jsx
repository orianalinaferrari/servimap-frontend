import { ReputacionPrestador } from './ReputacionPrestador'

export function DetallePrestador({ prestador, calificaciones = [], onVolver }) {
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
          Precio: ${prestador.precioMin.toLocaleString('es-AR')} – $
          {prestador.precioMax.toLocaleString('es-AR')}
        </p>
        <p className={prestador.disponible ? 'estado-disponible' : 'estado-no-disponible'}>
          {prestador.disponible ? 'Disponible' : 'No disponible'}
        </p>
      </div>

      <ReputacionPrestador prestador={prestador} calificaciones={calificaciones} />

      <h3>Contacto</h3>
      <ul className="contacto-lista">
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