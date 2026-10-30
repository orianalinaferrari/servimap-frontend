import { apiRequest } from './apiClient'
import { validarCalificacion } from '../utils/calificacionSolicitud'
export function registrarCalificacion(solicitudId, datos) {
  if (solicitudId == null || !String(solicitudId).trim()) throw new Error('El identificador de la solicitud no es válido.')
  const validados = validarCalificacion(datos)
  if (validados.comentario.length > 500) throw new Error('El comentario no puede superar los 500 caracteres.')
  return apiRequest('/api/calificaciones', { method: 'POST', json: { solicitudId, ...validados } })
}
export const listarCalificaciones = () => apiRequest('/api/calificaciones')
export const moderarComentario = (id, motivo) => apiRequest(`/api/calificaciones/${encodeURIComponent(id)}/moderacion`, { method: 'PATCH', json: { motivo } })
export const editarComentario = (id, comentario) => apiRequest(`/api/calificaciones/${encodeURIComponent(id)}/comentario`, { method: 'PATCH', json: { comentario } })
