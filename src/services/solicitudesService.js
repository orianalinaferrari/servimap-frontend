import { apiRequest, validarRutaApi } from './apiClient'
import { traducirErrorApi } from './apiServiceErrors'

export async function crearSolicitud(datos) {
  const endpoint = import.meta.env.VITE_SOLICITUDES_ENDPOINT

  if (!import.meta.env.VITE_API_URL || !endpoint) {
    throw new Error(
      'El servicio de solicitudes todavía no está configurado.'
    )
  }

  if (!endpoint.startsWith('/') || endpoint.startsWith('//')) {
    throw new Error('La ruta de solicitudes no es válida.')
  }

  validarRutaApi(endpoint)

  try {
    const resultado = await apiRequest(endpoint, {
      method: 'POST',
      json: datos,
    })

    return resultado ?? { confirmada: true }
  } catch (error) {
    traducirErrorApi(error, {
      401: 'Debés iniciar sesión para crear una solicitud.',
      403: 'No tenés permiso para crear solicitudes.',
      400: 'Los datos de la solicitud fueron rechazados.',
      422: 'Los datos de la solicitud fueron rechazados.',
      general: 'No se pudo crear la solicitud.',
    })
  }
}
