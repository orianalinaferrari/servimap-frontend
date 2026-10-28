import { apiRequest } from './apiClient'
import { traducirErrorApi } from './apiServiceErrors'

function esRutaValida(ruta) {
  return (
    typeof ruta === 'string' &&
    ruta.startsWith('/') &&
    !ruta.startsWith('//') &&
    !ruta.includes('?') &&
    !ruta.includes('#')
  )
}

function obtenerConfiguracion() {
  const apiUrl = import.meta.env.VITE_API_URL
  const endpoint = import.meta.env.VITE_SOLICITUDES_PRESTADOR_ENDPOINT

  if (!apiUrl || !endpoint) {
    throw new Error(
      'El servicio de solicitudes recibidas todavía no está configurado.'
    )
  }

  if (!esRutaValida(endpoint)) {
    throw new Error('La ruta de solicitudes recibidas no es válida.')
  }

  return { endpoint: endpoint.replace(/\/$/, '') }
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

function obtenerRutaAccion(endpoint, variable, solicitudId) {
  const rutaConfigurada = import.meta.env[variable]

  if (!rutaConfigurada) {
    throw new Error('La operación todavía no está configurada.')
  }

  if (
    !esRutaValida(rutaConfigurada) ||
    !rutaConfigurada.includes(':id')
  ) {
    throw new Error('La ruta de la operación no es válida.')
  }

  const ruta = rutaConfigurada.replace(
    ':id',
    encodeURIComponent(String(solicitudId))
  )

  if (!ruta.startsWith(endpoint + '/')) {
    throw new Error(
      'La ruta de la operación no corresponde a solicitudes recibidas.'
    )
  }

  return ruta
}

export async function obtenerSolicitudesPrestador() {
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

export async function aceptarSolicitudPrestador(solicitudId) {
  validarId(solicitudId)

  const { endpoint } = obtenerConfiguracion()

  const ruta = obtenerRutaAccion(
    endpoint,
    'VITE_ACEPTAR_SOLICITUD_ENDPOINT',
    solicitudId
  )

  return realizarPeticion(ruta, { method: 'PATCH' })
}

export async function rechazarSolicitudPrestador(solicitudId) {
  validarId(solicitudId)

  const { endpoint } = obtenerConfiguracion()

  const ruta = obtenerRutaAccion(
    endpoint,
    'VITE_RECHAZAR_SOLICITUD_ENDPOINT',
    solicitudId
  )

  return realizarPeticion(ruta, { method: 'PATCH' })
}

export async function marcarTrabajoTerminadoPrestador(solicitudId) {
  validarId(solicitudId)

  const { endpoint } = obtenerConfiguracion()

  const ruta = obtenerRutaAccion(
    endpoint,
    'VITE_MARCAR_TRABAJO_TERMINADO_ENDPOINT',
    solicitudId
  )

  return realizarPeticion(ruta, { method: 'PATCH' })
}
