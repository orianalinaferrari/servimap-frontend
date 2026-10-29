import { ESTADOS_SOLICITUD, normalizarEstadoSolicitud, tieneIdentificadorSolicitud } from './estadosSolicitud'
export function puedeMarcarTrabajoTerminado(solicitud) {
  return tieneIdentificadorSolicitud(solicitud) && normalizarEstadoSolicitud(solicitud.estado) === ESTADOS_SOLICITUD.ACEPTADA
}
