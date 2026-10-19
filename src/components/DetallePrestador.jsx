export function DetallePrestador({ prestador, onVolver }) {
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

      <p>
        {prestador.calificacionPromedio === null
          ? 'Sin calificaciones'
          : `Calificación: ${prestador.calificacionPromedio.toFixed(1)} / 5`}
      </p>
      <p>Trabajos finalizados: {prestador.trabajosFinalizados}</p>

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