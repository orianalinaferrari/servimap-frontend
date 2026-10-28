export class ApiError extends Error {
  constructor(mensaje, { status = null, codigo = 'HTTP_ERROR' } = {}) {
    super(mensaje)
    this.name = 'ApiError'
    this.status = status
    this.codigo = codigo
  }
}

export function obtenerApiUrl() {
  const url = import.meta.env.VITE_API_URL?.trim()

  if (!url) {
    throw new ApiError(
      'La URL de la API no está configurada.',
      { codigo: 'API_NO_CONFIGURADA' }
    )
  }

  let parsed

  try {
    parsed = new URL(url)
  } catch {
    throw new ApiError(
      'La URL de la API no es válida.',
      { codigo: 'API_URL_INVALIDA' }
    )
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new ApiError(
      'La URL de la API debe utilizar HTTP o HTTPS.',
      { codigo: 'API_URL_INVALIDA' }
    )
  }

  if (parsed.username || parsed.password ||
      parsed.search || parsed.hash) {
    throw new ApiError(
      'La URL de la API no debe incluir credenciales ni parámetros.',
      { codigo: 'API_URL_INVALIDA' }
    )
  }

  return url.replace(/\/+$/, '')
}

export function validarRutaApi(ruta) {
  if (
    typeof ruta !== 'string' ||
    !ruta.startsWith('/') ||
    ruta.startsWith('//') ||
    ruta.includes('?') ||
    ruta.includes('#') ||
    ruta.includes('\\')
  ) {
    throw new ApiError(
      'La ruta de la API no es válida.',
      { codigo: 'RUTA_INVALIDA' }
    )
  }

  return ruta
}

export async function apiRequest(ruta, opciones = {}) {
  const urlBase = obtenerApiUrl()
  validarRutaApi(ruta)

  const {
    token,
    json,
    headers: encabezados = {},
    ...opcionesFetch
  } = opciones

  const headers = new Headers(encabezados)

  if (token != null) {
    if (typeof token !== 'string' || !token.trim()) {
      throw new ApiError(
        'El token de autenticación no es válido.',
        { codigo: 'TOKEN_INVALIDO' }
      )
    }

    headers.set('Authorization', `Bearer ${token}`)
  }

  const configuracion = {
    ...opcionesFetch,
    credentials: 'include',
  }

  if (json !== undefined) {
    headers.set('Content-Type', 'application/json')
    configuracion.body = JSON.stringify(json)
  }

  if ([...headers.keys()].length > 0) {
    configuracion.headers = Object.fromEntries(headers.entries())

    if (headers.has('Content-Type')) {
      configuracion.headers['Content-Type'] =
        headers.get('Content-Type')
      delete configuracion.headers['content-type']
    }

    if (headers.has('Authorization')) {
      configuracion.headers.Authorization =
        headers.get('Authorization')
      delete configuracion.headers.authorization
    }
  }

  let respuesta

  try {
    respuesta = await fetch(`${urlBase}${ruta}`, configuracion)
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor.',
      { codigo: 'ERROR_RED' }
    )
  }

  if (!respuesta.ok) {
    throw new ApiError(
      `La solicitud falló con estado HTTP ${respuesta.status}.`,
      {
        status: respuesta.status,
        codigo: 'ERROR_HTTP',
      }
    )
  }

  if (respuesta.status === 204 || respuesta.status === 205) {
    return null
  }

  let contenido

  try {
    contenido = await respuesta.text()
  } catch {
    throw new ApiError(
      'No se pudo leer la respuesta del servidor.',
      { codigo: 'ERROR_RESPUESTA' }
    )
  }

  if (!contenido) {
    return null
  }

  try {
    return JSON.parse(contenido)
  } catch {
    throw new ApiError(
      'El servidor devolvió una respuesta JSON no válida.',
      { codigo: 'JSON_INVALIDO' }
    )
  }
}
