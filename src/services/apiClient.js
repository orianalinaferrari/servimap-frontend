import { obtenerToken, eliminarToken } from './sesionToken'

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
      parsed.search || parsed.hash || parsed.pathname !== '/') {
    throw new ApiError(
      'La URL de la API no debe incluir credenciales ni parámetros.',
      { codigo: 'API_URL_INVALIDA' }
    )
  }

  const esLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
  if (parsed.protocol !== 'https:' && !esLoopback) {
    throw new ApiError(
      'La API debe utilizar HTTPS fuera del entorno local.',
      { codigo: 'API_URL_INVALIDA' }
    )
  }

  return parsed.origin
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
    autenticar = true,
    parametros,
    json,
    headers: encabezados = {},
    ...opcionesFetch
  } = opciones

  const headers = new Headers(encabezados)

  const tokenEnviado = token ?? (autenticar ? obtenerToken() : null)
  if (tokenEnviado != null) {
    if (typeof tokenEnviado !== 'string' || !tokenEnviado.trim()) {
      throw new ApiError(
        'El token de autenticación no es válido.',
        { codigo: 'TOKEN_INVALIDO' }
      )
    }

    headers.set('Authorization', `Bearer ${tokenEnviado}`)
  }

  const configuracion = {
    ...opcionesFetch,
    credentials: 'omit',
    redirect: 'error',
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
    const query = new URLSearchParams()
    Object.entries(parametros || {}).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== '') query.set(clave, String(valor))
    })
    respuesta = await fetch(`${urlBase}${ruta}${query.size ? `?${query}` : ''}`, configuracion)
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor.',
      { codigo: 'ERROR_RED' }
    )
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401 && tokenEnviado && obtenerToken() === tokenEnviado) eliminarToken(true)
    let detalle
    try { detalle = await respuesta.json() } catch { /* Respuesta HTTP sin JSON. */ }
    const mensajes = { 400: 'Revisá los datos ingresados.', 401: 'Debés iniciar sesión nuevamente.', 403: 'No tenés permiso para realizar esta operación.', 404: 'El recurso no fue encontrado.', 409: 'Los datos o el estado cambiaron. Actualizá la información.', 500: 'El servidor no pudo completar la operación.' }
    throw new ApiError(
      typeof detalle?.error === 'string' ? detalle.error : mensajes[respuesta.status] || `La solicitud falló con estado HTTP ${respuesta.status}.`,
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
