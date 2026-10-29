export const ESTADOS_SOLICITUD = Object.freeze({
  PENDIENTE: 'PENDIENTE',
  ACEPTADA: 'ACEPTADA',
  RECHAZADA: 'RECHAZADA',
  CANCELADA: 'CANCELADA',
  FINALIZADA: 'FINALIZADA',
})

const ETIQUETAS_ESTADO = Object.freeze({
  [ESTADOS_SOLICITUD.PENDIENTE]: 'Pendiente',
  [ESTADOS_SOLICITUD.ACEPTADA]: 'Aceptada',
  [ESTADOS_SOLICITUD.RECHAZADA]: 'Rechazada',
  [ESTADOS_SOLICITUD.CANCELADA]: 'Cancelada',
  [ESTADOS_SOLICITUD.FINALIZADA]: 'Finalizada',
})

export function normalizarEstadoSolicitud(estado) {
  if (typeof estado !== 'string') {
    return null
  }

  const normalizado = estado.trim().toUpperCase()

  return Object.values(ESTADOS_SOLICITUD).includes(normalizado)
    ? normalizado
    : null
}

export function obtenerEtiquetaEstado(estado) {
  const normalizado = normalizarEstadoSolicitud(estado)

  if (normalizado) {
    return ETIQUETAS_ESTADO[normalizado]
  }

  return estado
    ? `Estado: ${String(estado)}`
    : 'Estado desconocido'
}

export function tieneIdentificadorSolicitud(solicitud) {
  if (!solicitud || typeof solicitud !== 'object') {
    return false
  }

  const id = solicitud.id

  return (
    (typeof id === 'string' || typeof id === 'number') &&
    String(id).trim() !== ''
  )
}

export function puedeCancelarSolicitud(solicitud) {
  return (
    [ESTADOS_SOLICITUD.PENDIENTE, ESTADOS_SOLICITUD.ACEPTADA].includes(normalizarEstadoSolicitud(solicitud?.estado))
  )
}

export function puedeResponderSolicitud(solicitud) {
  return (
    tieneIdentificadorSolicitud(solicitud) &&
    normalizarEstadoSolicitud(solicitud.estado) ===
      ESTADOS_SOLICITUD.PENDIENTE
  )
}

export function obtenerAccionesSolicitudCliente(solicitud) {
  const tieneId = tieneIdentificadorSolicitud(solicitud)

  return {
    verDetalle: tieneId,
    cancelar: tieneId && puedeCancelarSolicitud(solicitud),
  }
}

export function obtenerAccionesSolicitudPrestador(solicitud) {
  const puedeResponder = puedeResponderSolicitud(solicitud)

  return {
    verDetalle: tieneIdentificadorSolicitud(solicitud),
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

export function ordenarSolicitudesPorFecha(solicitudes) {
  if (!Array.isArray(solicitudes)) {
    return []
  }

  return [...solicitudes].sort((a, b) => {
    const fechaA = Date.parse(a.fechaCreacion || '') || 0
    const fechaB = Date.parse(b.fechaCreacion || '') || 0

    return fechaB - fechaA
  })
}
