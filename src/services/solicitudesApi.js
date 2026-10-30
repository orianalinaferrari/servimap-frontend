import { apiRequest } from './apiClient'

export function adaptarSolicitud(solicitud) {
  return { ...solicitud, servicio: solicitud.oficio?.nombre || solicitud.servicio || 'Servicio' }
}
export async function listarSolicitudes() {
  const resultado = await apiRequest('/api/solicitudes')
  if (!Array.isArray(resultado)) throw new Error('El servidor devolvió un formato de solicitudes no reconocido.')
  return resultado.map(adaptarSolicitud)
}
export async function transicionarSolicitud(id, accion) {
  if (id == null || !String(id).trim()) throw new Error('El identificador de la solicitud no es válido.')
  return apiRequest(`/api/solicitudes/${encodeURIComponent(id)}/${accion}`, { method: 'PATCH' })
}
