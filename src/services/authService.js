import { ApiError, apiRequest } from './apiClient'
import { guardarToken, obtenerToken, eliminarToken } from './sesionToken'

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
