import {
  normalizarEstadoSolicitud,
  obtenerEtiquetaEstado,
} from '../utils/estadosSolicitud'
import '../styles/EstadoSolicitud.css'

function EstadoSolicitud({ estado }) {
  const normalizado = normalizarEstadoSolicitud(estado)

  return (
    <span
      className={`estado-solicitud estado-solicitud--${
        normalizado?.toLowerCase() || 'desconocido'
      }`}
      data-estado={normalizado || 'DESCONOCIDO'}
    >
      {obtenerEtiquetaEstado(estado)}
    </span>
  )
}

export default EstadoSolicitud
