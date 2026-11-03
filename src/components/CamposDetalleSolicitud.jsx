import { formatearFechaArgentina } from '../utils/fechas'

// Campos comunes del detalle; las fechas usan el mismo formato en ambos roles.
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
      <dd>{formatearFechaArgentina(solicitud.fechaCreacion)}</dd>
    </>
  )
}

export default CamposDetalleSolicitud
