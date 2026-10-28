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

  return {
    apiUrl: apiUrl.replace(/\/$/, ''),
    endpoint: endpoint.replace(/\/$/, ''),
  }
}

function esRutaValida(ruta) {
  return (
    typeof ruta === 'string' &&
    ruta.startsWith('/') &&
    !ruta.startsWith('//') &&
    !ruta.includes('?') &&
    !ruta.includes('#')
  )
}

function validarId(solicitudId) {
  if (
    (typeof solicitudId !== 'string' && typeof solicitudId !== 'number') ||
    String(solicitudId).trim() === ''
  ) {
    throw new Error('El identificador de la solicitud no es válido.')
  }
}

async function realizarPeticion(url, opciones = {}) {
  let respuesta

  try {
    respuesta = await fetch(url, {
      credentials: 'include',
      ...opciones,
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor.')
  }

  if (respuesta.status === 401) {
    throw new Error('Debés iniciar sesión para consultar tus solicitudes.')
  }

  if (respuesta.status === 403) {
    throw new Error('No tenés permiso para realizar esta operación.')
  }

  if (respuesta.status === 404) {
    throw new Error('La solicitud no fue encontrada.')
  }

  if (respuesta.status === 409) {
    throw new Error(
      'La solicitud cambió de estado y ya no permite esta operación.'
    )
  }

  if (!respuesta.ok) {
    throw new Error('No se pudo completar la operación.')
  }

  if (respuesta.status === 204) {
    return null
  }

  let contenido

  try {
    contenido = await respuesta.text()
    return contenido ? JSON.parse(contenido) : null
  } catch {
    throw new Error('El servidor devolvió una respuesta no válida.')
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
  const { apiUrl, endpoint } = obtenerConfiguracion()

  const resultado = await realizarPeticion(`${apiUrl}${endpoint}`)

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

  const { apiUrl, endpoint } = obtenerConfiguracion()

  const ruta = obtenerRutaAccion(
    endpoint,
    'VITE_ACEPTAR_SOLICITUD_ENDPOINT',
    solicitudId
  )

  return realizarPeticion(`${apiUrl}${ruta}`, {
    method: 'PATCH',
  })
}

export async function rechazarSolicitudPrestador(solicitudId) {
  validarId(solicitudId)

  const { apiUrl, endpoint } = obtenerConfiguracion()

  const ruta = obtenerRutaAccion(
    endpoint,
    'VITE_RECHAZAR_SOLICITUD_ENDPOINT',
    solicitudId
  )

  return realizarPeticion(`${apiUrl}${ruta}`, {
    method: 'PATCH',
  })
}

export async function marcarTrabajoTerminadoPrestador(solicitudId) {
  validarId(solicitudId)

  const { apiUrl, endpoint } = obtenerConfiguracion()

  const ruta = obtenerRutaAccion(
    endpoint,
    'VITE_MARCAR_TRABAJO_TERMINADO_ENDPOINT',
    solicitudId
  )

  return realizarPeticion(`${apiUrl}${ruta}`, {
    method: 'PATCH',
  })
}
