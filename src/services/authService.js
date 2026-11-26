import { ApiError, apiRequest } from './apiClient'
import { guardarToken, obtenerToken, eliminarToken } from './sesionToken'
import { validarCambioContrasena } from '../utils/cambioContrasena'

export async function iniciarSesion(email, contrasena) {
  const sesion = await apiRequest('/api/auth/login', {
    method: 'POST', autenticar: false, json: { email: email.trim().toLowerCase(), password: contrasena },
  })
  if (!sesion?.usuario?.id || !sesion.usuario.rol) throw new Error('El servidor devolvió una sesión inválida.')
  guardarToken(sesion.token)
  return sesion.usuario
}

export async function registrarUsuario(datos) {
  return apiRequest('/api/auth/register', { method: 'POST', autenticar: false, json: datos })
}

export async function cerrarSesion() { eliminarToken() }

export async function cambiarContrasenaCuenta({ passwordActual, passwordNueva }, { token } = {}) {
  validarCambioContrasena({ passwordActual, passwordNueva })
  let confirmacion
  try {
    confirmacion = await apiRequest('/api/auth/me/password', { method: 'PATCH', token, json: { passwordActual, passwordNueva } })
  } catch (fallo) {
    // No reflejar mensajes arbitrarios del servidor que puedan contener contraseñas.
    const mensajes = {
      400: 'Revisá la contraseña actual: debe ser correcta, y la nueva debe ser distinta y tener al menos 8 caracteres.',
      401: 'Tu sesión venció. Iniciá sesión nuevamente.',
      403: 'No tenés permiso para cambiar la contraseña.',
      404: 'El cambio de contraseña todavía no está disponible en este servidor.',
      409: 'El servidor informó un conflicto. Volvé a intentarlo.',
      500: 'El servidor no pudo cambiar la contraseña. Volvé a intentarlo.',
    }
    throw new ApiError(mensajes[fallo.status] || 'No se pudo confirmar el cambio de contraseña. Revisá la conexión e intentá nuevamente.',
      { status: fallo.status, codigo: fallo.codigo })
  }
  if (!confirmacion || Array.isArray(confirmacion) || confirmacion.mensaje !== 'Contraseña actualizada') {
    throw new Error('El servidor no confirmó el cambio de contraseña. Verificá tu acceso antes de reintentar.')
  }
  return { mensaje: 'Contraseña actualizada' }
}

export async function obtenerSesion() {
  if (!obtenerToken()) return null
  try {
    return await apiRequest('/api/auth/me')
  } catch (error) {
    if (error instanceof ApiError && [401, 404].includes(error.status)) {
      eliminarToken()
      return null
    }
    throw error
  }
}
