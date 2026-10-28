import { validarCalificacion } from '../utils/calificacionSolicitud'

export async function registrarCalificacion(solicitudId, datos) {
  if (
    (typeof solicitudId !== 'string' &&
      typeof solicitudId !== 'number') ||
    String(solicitudId).trim() === ''
  ) {
    throw new Error('El identificador de la solicitud no es válido.')
  }

  const { puntaje, comentario } = validarCalificacion(datos)

  const apiUrl = import.meta.env.VITE_API_URL
  const endpoint = import.meta.env.VITE_CALIFICAR_SOLICITUD_ENDPOINT

  if (!apiUrl || !endpoint) {
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

  let respuesta

  try {
    respuesta = await fetch(
      `${apiUrl.replace(/\/$/, '')}${ruta}`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ puntaje, comentario }),
      }
    )
  } catch {
    throw new Error('No se pudo conectar con el servidor.')
  }

  if (respuesta.status === 401) {
    throw new Error('Debés iniciar sesión para calificar.')
  }

  if (respuesta.status === 403) {
    throw new Error('No tenés permiso para calificar esta solicitud.')
  }

  if (respuesta.status === 404) {
    throw new Error('La solicitud no fue encontrada.')
  }

  if (respuesta.status === 409) {
    throw new Error(
      'Esta solicitud ya fue calificada o no permite calificación.'
    )
  }

  if (!respuesta.ok) {
    throw new Error('No se pudo registrar la calificación.')
  }

  if (respuesta.status === 204) {
    return null
  }

  const contenido = await respuesta.text()
  return contenido ? JSON.parse(contenido) : null
}