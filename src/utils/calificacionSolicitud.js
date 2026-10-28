import {
  ESTADOS_SOLICITUD,
  normalizarEstadoSolicitud,
  tieneIdentificadorSolicitud,
} from './estadosSolicitud'

export function obtenerCalificacionSolicitud(solicitud) {
  const calificacion = solicitud?.calificacion

  if (
    calificacion &&
    typeof calificacion === 'object' &&
    !Array.isArray(calificacion)
  ) {
    return calificacion
  }

  return null
}

export function solicitudYaCalificada(solicitud) {
  return (
    obtenerCalificacionSolicitud(solicitud) !== null ||
    solicitud?.calificada === true ||
    solicitud?.calificacionId != null
  )
}

export function puedeCalificarSolicitud(solicitud) {
  return (
    tieneIdentificadorSolicitud(solicitud) &&
    normalizarEstadoSolicitud(solicitud.estado) ===
      ESTADOS_SOLICITUD.FINALIZADA &&
    !solicitudYaCalificada(solicitud)
  )
}

export function validarCalificacion({ puntaje, comentario }) {
  if (
    !Number.isInteger(puntaje) ||
    puntaje < 1 ||
    puntaje > 5
  ) {
    throw new Error('Seleccioná una puntuación entre 1 y 5.')
  }

  if (typeof comentario !== 'string') {
    throw new Error('El comentario debe ser un texto.')
  }

  return {
    puntaje,
    comentario: comentario.trim(),
  }
}