import { apiRequest } from './apiClient'
import { traducirErrorApi } from './apiServiceErrors'

function obtenerConfiguracion() {
  const apiUrl = import.meta.env.VITE_API_URL
  const endpoint = import.meta.env.VITE_SOLICITUDES_CLIENTE_ENDPOINT

  if (!apiUrl || !endpoint) {
    throw new Error(
      'El servicio de consulta de solicitudes todavía no está configurado.'
    )
  }

  if (
    !endpoint.startsWith('/') ||
    endpoint.startsWith('//') ||
    endpoint.includes('?') ||
    endpoint.includes('#')
  ) {
    throw new Error('La ruta de solicitudes del cliente no es válida.')
  }

  return { endpoint: endpoint.replace(/\/$/, '') }
}

async function realizarPeticion(ruta, opciones = {}) {
  try {
    return await apiRequest(ruta, opciones)
  } catch (error) {
    traducirErrorApi(error, {
      401: 'Debés iniciar sesión para consultar tus solicitudes.',
      403: 'No tenés permiso para realizar esta operación.',
      404: 'La solicitud no fue encontrada.',
      409: 'La solicitud cambió de estado y ya no permite esta operación.',
      general: 'No se pudo completar la operación.',
    })
  }
}

export async function obtenerSolicitudesCliente() {
  const { endpoint } = obtenerConfiguracion()

  const resultado = await realizarPeticion(endpoint)

  if (Array.isArray(resultado)) {
    return resultado
  }

  if (resultado && Array.isArray(resultado.solicitudes)) {
    return resultado.solicitudes
  }

  throw new Error(
    'El servidor devolvió un formato de solicitudes no reconocido.'
  )
}

function validarId(solicitudId) {
  if (
    (typeof solicitudId !== 'string' &&
      typeof solicitudId !== 'number') ||
    String(solicitudId).trim() === ''
  ) {
    throw new Error('El identificador de la solicitud no es válido.')
  }
}

function obtenerRutaAccion(variable, endpoint, solicitudId, mensaje) {
  const configurada = import.meta.env[variable]

  if (!configurada) {
    throw new Error(mensaje)
  }

  if (
    !configurada.startsWith('/') ||
    configurada.startsWith('//') ||
    configurada.includes('?') ||
    configurada.includes('#') ||
    !configurada.includes(':id')
  ) {
    throw new Error('La ruta de la operación no es válida.')
  }

  const ruta = configurada.replace(
    ':id',
    encodeURIComponent(String(solicitudId))
  )

  if (!ruta.startsWith(endpoint + '/')) {
    throw new Error('La ruta de la operación no corresponde a solicitudes.')
  }

  return ruta
}

export async function cancelarSolicitudCliente(solicitudId) {
  validarId(solicitudId)

  const { endpoint } = obtenerConfiguracion()

  const ruta = obtenerRutaAccion(
    'VITE_CANCELAR_SOLICITUD_ENDPOINT',
    endpoint,
    solicitudId,
    'La operación de cancelación todavía no está configurada.'
  )

  return realizarPeticion(ruta, { method: 'PATCH' })
}

export async function confirmarFinalizacionCliente(solicitudId) {
  validarId(solicitudId)

  const { endpoint } = obtenerConfiguracion()

  const ruta = obtenerRutaAccion(
    'VITE_CONFIRMAR_FINALIZACION_ENDPOINT',
    endpoint,
    solicitudId,
    'La operación de confirmación todavía no está configurada.'
  )

  return realizarPeticion(ruta, { method: 'PATCH' })
}
