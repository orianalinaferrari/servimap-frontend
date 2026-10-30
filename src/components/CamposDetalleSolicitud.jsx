// Campos comunes del detalle; cada vista conserva su propio formato de valores.
function CamposDetalleSolicitud({ solicitud, formatear }) {
  return (
    <>
      <dt>Servicio</dt>
      <dd>{formatear(solicitud.servicio)}</dd>

      <dt>Descripción</dt>
      <dd>{formatear(solicitud.descripcion)}</dd>

      <dt>Dirección</dt>
      <dd>{formatear(solicitud.direccion)}</dd>

      <dt>Contacto preferido</dt>
      <dd>{formatear(solicitud.contactoPreferido)}</dd>

      <dt>Fecha de creación</dt>
      <dd>{formatear(solicitud.fechaCreacion)}</dd>
    </>
  )
}

export default CamposDetalleSolicitud
