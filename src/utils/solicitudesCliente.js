export const ESTADOS_SOLICITUD = Object.freeze({
  PENDIENTE: 'PENDIENTE',
  ACEPTADA: 'ACEPTADA',
  RECHAZADA: 'RECHAZADA',
  CANCELADA: 'CANCELADA',
})

const ETIQUETAS_ESTADO = {
  [ESTADOS_SOLICITUD.PENDIENTE]: 'Pendiente',
  [ESTADOS_SOLICITUD.ACEPTADA]: 'Aceptada',
  [ESTADOS_SOLICITUD.RECHAZADA]: 'Rechazada',
  [ESTADOS_SOLICITUD.CANCELADA]: 'Cancelada',
}

export function normalizarEstadoSolicitud(estado) {
  if (typeof estado !== 'string') return null

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

export function puedeCancelarSolicitud(solicitud) {
  return normalizarEstadoSolicitud(solicitud?.estado) ===
    ESTADOS_SOLICITUD.PENDIENTE
}

export function obtenerAccionesSolicitud(solicitud) {
  return {
    verDetalle: Boolean(solicitud?.id),
    cancelar: Boolean(solicitud?.id) && puedeCancelarSolicitud(solicitud),
  }
}

export function ordenarSolicitudesPorFecha(solicitudes) {
  if (!Array.isArray(solicitudes)) return []

  return [...solicitudes].sort((a, b) => {
    const fechaA = Date.parse(a.fechaCreacion || '') || 0
    const fechaB = Date.parse(b.fechaCreacion || '') || 0

    return fechaB - fechaA
  })
}
