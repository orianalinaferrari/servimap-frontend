import { validarCalificacion } from '../utils/calificacionSolicitud'
import { apiRequest } from './apiClient'
import { traducirErrorApi } from './apiServiceErrors'

export async function registrarCalificacion(solicitudId, datos) {
  if (
    (typeof solicitudId !== 'string' &&
      typeof solicitudId !== 'number') ||
    String(solicitudId).trim() === ''
  ) {
    throw new Error('El identificador de la solicitud no es válido.')
  }

  const { puntaje, comentario } = validarCalificacion(datos)

  const endpoint = import.meta.env.VITE_CALIFICAR_SOLICITUD_ENDPOINT

  if (!import.meta.env.VITE_API_URL || !endpoint) {
    throw new Error(
      'El servicio de calificaciones todavía no está configurado.'
    )
  }

  if (
    !endpoint.startsWith('/') ||
    endpoint.startsWith('//') ||
    endpoint.includes('?') ||
    endpoint.includes('#') ||
    !endpoint.includes(':id')
  ) {
    throw new Error('La ruta de calificación no es válida.')
  }

  const ruta = endpoint.replace(
    ':id',
    encodeURIComponent(String(solicitudId))
  )

  try {
    return await apiRequest(ruta, {
      method: 'POST',
      json: { puntaje, comentario },
    })
  } catch (error) {
    traducirErrorApi(error, {
      401: 'Debés iniciar sesión para calificar.',
      403: 'No tenés permiso para calificar esta solicitud.',
      404: 'La solicitud no fue encontrada.',
      409: 'Esta solicitud ya fue calificada o no permite calificación.',
      general: 'No se pudo registrar la calificación.',
    })
  }
}
