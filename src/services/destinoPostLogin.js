import { obtenerMiPerfil } from './prestadoresService'
import { camposPendientesPrestador } from '../utils/perfilUsuario'
import { normalizarRol, obtenerDestinoPostLogin, RUTA_COMPLETAR_PERFIL_PRESTADOR, ROLES } from '../utils/roles'

// El CLIENTE no tiene endpoint para completar datos: siempre entra a su panel.
export async function resolverDestinoPostLogin(usuario, origen) {
  const destino = obtenerDestinoPostLogin(usuario?.rol, origen)
  if (normalizarRol(usuario?.rol) !== ROLES.PRESTADOR) return destino
  try {
    const perfil = await obtenerMiPerfil()
    return camposPendientesPrestador(perfil).length ? RUTA_COMPLETAR_PERFIL_PRESTADOR : destino
  } catch {
    // Un fallo al consultar el perfil no debe impedir entrar al panel.
    return destino
  }
}
