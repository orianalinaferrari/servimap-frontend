
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { normalizarRol, ROLES } from '../../utils/roles'

function NavegacionRoles() {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return <p role="status">Verificando sesión...</p>
  }

  const rol = normalizarRol(usuario?.rol)

  return (
    <nav aria-label="Navegación según rol">
      <NavLink to="/">Inicio</NavLink>

      {!usuario && (
        <>
          <NavLink to="/login">Iniciar sesión</NavLink>
          <NavLink to="/registro">Crear cuenta</NavLink>
        </>
      )}

      {rol === ROLES.CLIENTE && (
        <NavLink to="/cliente">Mi panel de cliente</NavLink>
      )}

      {rol === ROLES.PRESTADOR && (
        <>
          <NavLink to="/prestador" end>Mi panel de prestador</NavLink>

          <NavLink to="/prestador/perfil">Mi perfil</NavLink>

          <NavLink to="/prestador/oficios">Mis oficios</NavLink>
        </>
      )}

      {rol === ROLES.ADMINISTRADOR && (
        <NavLink to="/admin">Panel de administración</NavLink>
      )}
    </nav>
  )
}

export default NavegacionRoles
