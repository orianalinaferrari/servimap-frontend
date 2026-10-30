
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import './styles/ServiMapPublico.css'
import AppRoutes from './routes/AppRoutes'
import DirectorioPrestadores from './components/DirectorioPrestadores'
import LandingEntrada from './components/LandingEntrada'
import { PanelAdministracion } from './components/PanelAdministracion'
import NavegacionRoles from './components/auth/NavegacionRoles'
import { useAuth } from './context/useAuth'

function App() {
  const [cerrandoSesion, setCerrandoSesion] = useState(false)
  const [errorSesion, setErrorSesion] = useState('')

  const { usuario, autenticado, cargando, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const esInicio = location.pathname === '/'
  const esAccesoPublico = ['/login', '/registro'].includes(location.pathname)
  const TituloDirectorio = autenticado ? 'h1' : 'h2'

  async function handleCerrarSesion() {
    if (cerrandoSesion) return

    setErrorSesion('')
    setCerrandoSesion(true)

    try {
      await logout()
      navigate('/')
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
      <header className={esAccesoPublico ? 'servimap-header-minimo' : 'app-header'}>
        <Link className="servimap-logo" to="/" aria-label="ServiMap, inicio">ServiMap<span>Servicios cerca tuyo</span></Link>

        {esAccesoPublico ? (
          <Link className="servimap-volver" to="/">← Volver al inicio</Link>
        ) : <NavegacionRoles />}

        {!esAccesoPublico && (cargando ? (
          <p role="status">Verificando sesión...</p>
        ) : autenticado ? (
          <div>
            <p>
              Sesión iniciada
              {usuario?.nombre ? `: ${usuario.nombre}` : ''}
            </p>

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
      </header>

      <AppRoutes panelAdministracion={panelAdministracion} />

      {esInicio && (
        <main className="inicio">
          {!autenticado && <LandingEntrada />}
          <div className="inicio-presentacion inicio-directorio">
            <p className="etiqueta">Conectá con profesionales</p>
            <TituloDirectorio>Encontrá prestadores de servicios</TituloDirectorio>
            <p>Buscá profesionales disponibles en ServiMap.</p>

          </div>
          <DirectorioPrestadores />

        </main>
      )}
    </>
  )
}

export default App

