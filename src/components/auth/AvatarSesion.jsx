import { useNavigate } from 'react-router-dom'
import { IconoPrestador } from '../prestador/IconoPrestador'
import { obtenerIniciales } from '../../utils/perfilUsuario'
import { normalizarRol, obtenerPerfilPorRol, ROLES } from '../../utils/roles'
import { FotoPrestador } from '../prestador/FotoPrestador'

function AvatarSesion({ usuario }) {
  const navigate = useNavigate()
  const iniciales = obtenerIniciales(usuario?.nombre)
  const perfil = obtenerPerfilPorRol(usuario?.rol)
  const respaldo = iniciales || <IconoPrestador tipo="usuario" />
  const contenido = normalizarRol(usuario?.rol) === ROLES.PRESTADOR
    ? <FotoPrestador key={`${usuario?.id}:${usuario?.fotoPerfil}`} prestador={usuario} respaldo={respaldo} />
    : respaldo

  // Sin perfil en la API (ADMINISTRADOR): identificación visual, no un botón.
  if (!perfil) {
    return <span className="avatar-sesion" role="img" aria-label={`Sesión iniciada${usuario?.nombre ? `: ${usuario.nombre}` : ''}`} title={usuario?.nombre}>{contenido}</span>
  }

  return <button type="button" className="avatar-sesion" aria-label="Ir a mi perfil" title={usuario?.nombre} onClick={() => navigate(perfil)}>{contenido}</button>
}

export default AvatarSesion
