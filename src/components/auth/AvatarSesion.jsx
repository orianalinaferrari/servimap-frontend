import { useNavigate } from 'react-router-dom'
import { IconoPrestador } from '../prestador/IconoPrestador'
import { obtenerIniciales } from '../../utils/perfilUsuario'
import { obtenerPerfilPorRol } from '../../utils/roles'

function AvatarSesion({ usuario }) {
  const navigate = useNavigate()
  const iniciales = obtenerIniciales(usuario?.nombre)
  const perfil = obtenerPerfilPorRol(usuario?.rol)
  const contenido = iniciales || <IconoPrestador tipo="usuario" />

  // Sin perfil en la API (ADMINISTRADOR): identificación visual, no un botón.
  if (!perfil) {
    return <span className="avatar-sesion" role="img" aria-label={`Sesión iniciada${usuario?.nombre ? `: ${usuario.nombre}` : ''}`} title={usuario?.nombre}>{contenido}</span>
  }

  return <button type="button" className="avatar-sesion" aria-label="Ir a mi perfil" title={usuario?.nombre} onClick={() => navigate(perfil)}>{contenido}</button>
}

export default AvatarSesion
