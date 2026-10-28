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

  return {
    apiUrl: apiUrl.replace(/\/$/, ''),
    endpoint: endpoint.replace(/\/$/, ''),
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

  const contenido = await respuesta.text()

  return contenido ? JSON.parse(contenido) : null
}

export async function obtenerSolicitudesCliente() {
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

export async function cancelarSolicitudCliente(solicitudId) {
  if (
    (typeof solicitudId !== 'string' && typeof solicitudId !== 'number') ||
    String(solicitudId).trim() === ''
  ) {
    throw new Error('El identificador de la solicitud no es válido.')
  }

  const { apiUrl, endpoint } = obtenerConfiguracion()
  const cancelacion = import.meta.env.VITE_CANCELAR_SOLICITUD_ENDPOINT

  if (!cancelacion) {
    throw new Error(
      'La operación de cancelación todavía no está configurada.'
    )
  }

  if (
    !cancelacion.startsWith('/') ||
    cancelacion.startsWith('//') ||
    !cancelacion.includes(':id')
  ) {
    throw new Error('La ruta de cancelación no es válida.')
  }

  const ruta = cancelacion.replace(':id', encodeURIComponent(String(solicitudId)))

  if (!ruta.startsWith(endpoint + '/')) {
    throw new Error('La ruta de cancelación no corresponde a solicitudes.')
  }

  return realizarPeticion(`${apiUrl}${ruta}`, {
    method: 'PATCH',
  })
}

export async function confirmarFinalizacionCliente(solicitudId) {
  if (
    (typeof solicitudId !== 'string' && typeof solicitudId !== 'number') ||
    String(solicitudId).trim() === ''
  ) {
    throw new Error('El identificador de la solicitud no es válido.')
  }

  const { apiUrl, endpoint } = obtenerConfiguracion()
  const configurada = import.meta.env.VITE_CONFIRMAR_FINALIZACION_ENDPOINT

  if (!configurada) {
    throw new Error(
      'La operación de confirmación todavía no está configurada.'
    )
  }

  if (
    !configurada.startsWith('/') ||
    configurada.startsWith('//') ||
    configurada.includes('?') ||
    configurada.includes('#') ||
    !configurada.includes(':id')
  ) {
    throw new Error('La ruta de confirmación no es válida.')
  }

  const ruta = configurada.replace(
    ':id',
    encodeURIComponent(String(solicitudId))
  )

  if (!ruta.startsWith(endpoint + '/')) {
    throw new Error(
      'La ruta de confirmación no corresponde a solicitudes.'
    )
  }

  return realizarPeticion(`${apiUrl}${ruta}`, {
    method: 'PATCH',
  })
}
