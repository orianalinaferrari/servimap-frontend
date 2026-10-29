export const EVENTO_SESION_EXPIRADA = 'servimap:sesion-expirada'
const CLAVE_TOKEN = 'servimap-jwt'

export function expiracionToken(token) {
  try {
    const parte = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(parte))
    return Number.isFinite(exp) ? exp * 1000 : 0
  } catch { return 0 }
}

export function eliminarToken(expirada = false) {
  try { sessionStorage.removeItem(CLAVE_TOKEN) } catch { /* Sesión solo de esta pestaña. */ }
  if (expirada) window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA))
}

export function guardarToken(token) {
  if (typeof token !== 'string' || expiracionToken(token) <= Date.now()) {
    throw new Error('El servidor devolvió una sesión inválida o vencida.')
  }
  try { sessionStorage.setItem(CLAVE_TOKEN, token) } catch {
    throw new Error('Habilitá el almacenamiento de sesión para iniciar sesión.')
  }
}

export function obtenerToken() {
  let token
  try { token = sessionStorage.getItem(CLAVE_TOKEN) } catch { return null }
  if (token && expiracionToken(token) <= Date.now()) {
    eliminarToken(true)
    return null
  }
  return token
}
