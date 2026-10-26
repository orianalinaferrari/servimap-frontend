
import { Link } from 'react-router-dom'
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
      <Link to="/">Inicio</Link>{' | '}

      {!usuario && (
        <>
          <Link to="/login">Iniciar sesión</Link>{' | '}
          <Link to="/registro">Crear cuenta</Link>
        </>
      )}

      {rol === ROLES.CLIENTE && (
        <Link to="/cliente">Mi panel de cliente</Link>
      )}

      {rol === ROLES.PRESTADOR && (
        <>
          <Link to="/prestador">Mi panel de prestador</Link>
          {' | '}
          <Link to="/prestador/perfil">Mi perfil</Link>
          {' | '}
          <Link to="/prestador/oficios">Mis oficios</Link>
        </>
      )}

      {rol === ROLES.ADMINISTRADOR && (
        <Link to="/admin">Panel de administración</Link>
      )}
    </nav>
  )
}

export default NavegacionRoles
