
export const ROLES = Object.freeze({
  CLIENTE: 'CLIENTE',
  PRESTADOR: 'PRESTADOR',
  ADMINISTRADOR: 'ADMINISTRADOR',
})

export function normalizarRol(rol) {
  if (typeof rol !== 'string') return null

  const valor = rol.trim().toUpperCase()

  return Object.values(ROLES).includes(valor)
    ? valor
    : null
}

export function tieneRol(usuario, rolesPermitidos) {
  if (!usuario || !Array.isArray(rolesPermitidos)) {
    return false
  }

  const rol = normalizarRol(usuario.rol)

  return rol !== null && rolesPermitidos.includes(rol)
}
