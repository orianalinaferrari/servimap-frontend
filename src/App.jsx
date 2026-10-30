
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import './styles/ServiMapPublico.css'
import AppRoutes from './routes/AppRoutes'
import DirectorioPrestadores from './components/DirectorioPrestadores'
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
          <div className="inicio-presentacion">
            <p className="etiqueta">Conectá con profesionales</p>
            <h1>Encontrá prestadores de servicios</h1>
            <p>Buscá profesionales disponibles en ServiMap.</p>

            {!autenticado && (
              <div className="inicio-acciones">
                <Link className="enlace-boton" to="/registro?rol=CLIENTE">Soy cliente</Link>
                <Link className="enlace-boton secundario" to="/registro?rol=PRESTADOR">Soy prestador</Link>
              </div>
            )}
          </div>
          <DirectorioPrestadores />

          <p>
            <Link to="/login">Acceder a mi cuenta</Link>
          </p>
        </main>
      )}
    </>
  )
}

export default App

