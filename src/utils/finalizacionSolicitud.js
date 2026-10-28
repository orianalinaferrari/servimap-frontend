import {
  ESTADOS_SOLICITUD,
  normalizarEstadoSolicitud,
  tieneIdentificadorSolicitud,
} from './estadosSolicitud'

export function estaPendienteConfirmacionFinalizacion(solicitud) {
  return (
    tieneIdentificadorSolicitud(solicitud) &&
    normalizarEstadoSolicitud(solicitud.estado) ===
      ESTADOS_SOLICITUD.ACEPTADA &&
    solicitud.finalizacionPendienteConfirmacion === true
  )
}

export function puedeMarcarTrabajoTerminado(solicitud) {
  return (
    tieneIdentificadorSolicitud(solicitud) &&
    normalizarEstadoSolicitud(solicitud.estado) ===
      ESTADOS_SOLICITUD.ACEPTADA &&
    solicitud.finalizacionPendienteConfirmacion === false
  )
}

export function puedeConfirmarFinalizacion(solicitud) {
  return estaPendienteConfirmacionFinalizacion(solicitud)
}
