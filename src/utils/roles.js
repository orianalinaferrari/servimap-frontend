
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

const PANELES_POR_ROL = Object.freeze({
  [ROLES.CLIENTE]: '/cliente',
  [ROLES.PRESTADOR]: '/prestador',
  [ROLES.ADMINISTRADOR]: '/admin',
})

// ADMINISTRADOR no tiene perfil editable en la API.
const PERFILES_POR_ROL = Object.freeze({
  [ROLES.CLIENTE]: '/cliente/perfil',
  [ROLES.PRESTADOR]: '/prestador/perfil',
})

export const RUTA_COMPLETAR_PERFIL_PRESTADOR = '/prestador/completar-perfil'

export function obtenerPanelPorRol(rol) {
  return PANELES_POR_ROL[normalizarRol(rol)] ?? '/'
}

export function obtenerPerfilPorRol(rol) {
  return PERFILES_POR_ROL[normalizarRol(rol)] ?? null
}

// Solo se respeta el origen si pertenece al panel del propio rol.
export function obtenerDestinoPostLogin(rol, origen) {
  const panel = obtenerPanelPorRol(rol)
  if (panel === '/' || typeof origen !== 'string') return panel
  return origen === panel || origen.startsWith(`${panel}/`) ? origen : panel
}

export function tieneRol(usuario, rolesPermitidos) {
  if (!usuario || !Array.isArray(rolesPermitidos)) {
    return false
  }

  const rol = normalizarRol(usuario.rol)

  return rol !== null && rolesPermitidos.includes(rol)
}
