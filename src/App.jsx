
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import './styles/ServiMapPublico.css'
import './styles/PrestadorVisual.css'
import './styles/ClienteVisual.css'
import AppRoutes from './routes/AppRoutes'
import LandingEntrada from './components/LandingEntrada'
import { PanelAdministracion } from './components/PanelAdministracion'
import NavegacionRoles from './components/auth/NavegacionRoles'
import AvatarSesion from './components/auth/AvatarSesion'
import { useAuth } from './context/useAuth'

function App() {
  const [cerrandoSesion, setCerrandoSesion] = useState(false)
  const [errorSesion, setErrorSesion] = useState('')

  const { usuario, autenticado, cargando, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const esInicio = location.pathname === '/'
  const esDirectorio = location.pathname === '/prestadores'
  const esAdministracion = location.pathname === '/admin'
  const esPrestador = location.pathname === '/prestador' || location.pathname.startsWith('/prestador/')
  const esCliente = location.pathname === '/cliente' || location.pathname.startsWith('/cliente/')
  const esAccesoPublico = ['/login', '/registro'].includes(location.pathname)

  async function handleCerrarSesion() {
    if (cerrandoSesion) return

    setErrorSesion('')
    setCerrandoSesion(true)

    try {
      await logout()
      await navigate('/')
    } catch (error) {
      setErrorSesion(
        error instanceof Error
          ? error.message
          : 'No se pudo cerrar la sesión.'
      )
    } finally {
      setCerrandoSesion(false)
    }
  }

  const panelAdministracion = <PanelAdministracion />

  return (
    <>
      {!esInicio && <header className={esAccesoPublico ? 'servimap-header-minimo' : esDirectorio ? 'app-header directorio-header' : esAdministracion ? 'app-header administracion-header' : esPrestador ? 'app-header prestador-header' : esCliente ? 'app-header cliente-header' : 'app-header'}>
        <Link className="servimap-logo" to="/" aria-label="ServiMap, inicio">ServiMap<span>Servicios cerca tuyo</span></Link>

        {esAccesoPublico ? (
          <Link className="servimap-volver" to="/">← Volver al inicio</Link>
        ) : <NavegacionRoles />}

        {!esAccesoPublico && (cargando ? (
          <p role="status">Verificando sesión...</p>
        ) : autenticado ? (
          <div>
            <AvatarSesion usuario={usuario} />

            <button
              type="button"
              onClick={handleCerrarSesion}
              disabled={cerrandoSesion}
            >
              {cerrandoSesion
                ? 'Cerrando sesión...'
                : 'Cerrar sesión'}
            </button>
          </div>
        ) : null)}

        {errorSesion && <p role="alert">{errorSesion}</p>}
      </header>}

      <AppRoutes panelAdministracion={panelAdministracion} />

      {esInicio && (
        <main className="inicio inicio-landing"><LandingEntrada /></main>
      )}
    </>
  )
}

export default App

