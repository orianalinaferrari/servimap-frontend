import { ApiError, apiRequest } from './apiClient'

function traducirError(error, mensajes = {}) {
  if (!(error instanceof ApiError)) {
    throw error
  }

  if (error.codigo === 'API_NO_CONFIGURADA') {
    throw new Error(
      'El servicio de autenticación todavía no está configurado.'
    )
  }

  if (error.codigo === 'ERROR_RED') {
    throw new Error('No se pudo conectar con el servidor.')
  }

  if (error.status && mensajes[error.status]) {
    throw new Error(mensajes[error.status])
  }

  throw new Error(
    mensajes.general || 'Ocurrió un error de autenticación.'
  )
}

export async function iniciarSesion(email, contrasena) {
  try {
    return await apiRequest('/auth/login', {
      method: 'POST',
      json: { email, contrasena },
    })
  } catch (error) {
    traducirError(error, {
      401: 'Email o contraseña incorrectos.',
      general: 'Ocurrió un error al iniciar sesión.',
    })
  }
}

export async function cerrarSesion() {
  try {
    await apiRequest('/auth/logout', {
      method: 'POST',
    })
  } catch (error) {
    traducirError(error, {
      general: 'No se pudo cerrar la sesión.',
    })
  }
}

export async function obtenerSesion() {
  if (!import.meta.env.VITE_API_URL) {
    return null
  }

  try {
    return await apiRequest('/auth/me')
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null
    }

    traducirError(error, {
      general: 'No se pudo verificar la sesión.',
    })
  }
}
