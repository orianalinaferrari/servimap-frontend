import {
  ESTADOS_SOLICITUD,
  normalizarEstadoSolicitud,
  obtenerEtiquetaEstado,
  ordenarSolicitudesPorFecha,
} from './solicitudesCliente'

export { obtenerEtiquetaEstado, ordenarSolicitudesPorFecha }

export function puedeResponderSolicitud(solicitud) {
  return (
    solicitud !== null &&
    typeof solicitud === 'object' &&
    solicitud.id !== null &&
    solicitud.id !== undefined &&
    String(solicitud.id).trim() !== '' &&
    normalizarEstadoSolicitud(solicitud.estado) === ESTADOS_SOLICITUD.PENDIENTE
  )
}

export function obtenerAccionesSolicitudPrestador(solicitud) {
  const tieneId =
    solicitud !== null &&
    typeof solicitud === 'object' &&
    solicitud.id !== null &&
    solicitud.id !== undefined &&
    String(solicitud.id).trim() !== ''

  const puedeResponder = puedeResponderSolicitud(solicitud)

  return {
    verDetalle: tieneId,
    aceptar: puedeResponder,
    rechazar: puedeResponder,
  }
}

export function obtenerEstadoDespuesDeResponder(accion) {
  if (accion === 'aceptar') {
    return ESTADOS_SOLICITUD.ACEPTADA
  }

  if (accion === 'rechazar') {
    return ESTADOS_SOLICITUD.RECHAZADA
  }

  throw new Error('La acción sobre la solicitud no es válida.')
}
