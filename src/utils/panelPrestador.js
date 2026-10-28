import {
  ESTADOS_SOLICITUD,
  normalizarEstadoSolicitud,
  ordenarSolicitudesPorFecha,
} from './estadosSolicitud'

export function resumirSolicitudesPrestador(solicitudes) {
  const lista = Array.isArray(solicitudes) ? solicitudes : []

  const resumen = {
    total: lista.length,
    pendientes: 0,
    aceptadas: 0,
    finalizadas: 0,
    rechazadas: 0,
    canceladas: 0,
  }

  for (const solicitud of lista) {
    const estado = normalizarEstadoSolicitud(solicitud?.estado)

    switch (estado) {
      case ESTADOS_SOLICITUD.PENDIENTE:
        resumen.pendientes += 1
        break
      case ESTADOS_SOLICITUD.ACEPTADA:
        resumen.aceptadas += 1
        break
      case ESTADOS_SOLICITUD.FINALIZADA:
        resumen.finalizadas += 1
        break
      case ESTADOS_SOLICITUD.RECHAZADA:
        resumen.rechazadas += 1
        break
      case ESTADOS_SOLICITUD.CANCELADA:
        resumen.canceladas += 1
        break
      default:
        break
    }
  }

  return resumen
}

export function obtenerActividadRecientePrestador(
  solicitudes,
  limite = 5
) {
  const lista = Array.isArray(solicitudes) ? solicitudes : []

  return ordenarSolicitudesPorFecha(lista)
    .slice(0, Math.max(0, limite))
}
