
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { tieneRol } from '../../utils/roles'

function RutaProtegida({ rolesPermitidos, children }) {
  const { usuario, cargando } = useAuth()
  const location = useLocation()

  if (cargando) {
    return <p role="status">Verificando sesión...</p>
  }

  if (!usuario) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  if (!tieneRol(usuario, rolesPermitidos)) {
    return <Navigate to="/acceso-denegado" replace />
  }

  return children
}

export default RutaProtegida
