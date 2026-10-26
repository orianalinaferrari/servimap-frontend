
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import AppRoutes from './routes/AppRoutes'
import { BuscadorPrestadores } from './components/BuscadorPrestadores'
import { PanelAdministracion } from './components/PanelAdministracion'
import NavegacionRoles from './components/auth/NavegacionRoles'
import { calificacionesMock } from './data/calificacionesMock'
import { prestadoresMock } from './data/prestadoresMock'
import { moderarCalificacion } from './utils/reputacion'
import { useAuth } from './context/useAuth'

function App() {
  const [calificaciones, setCalificaciones] = useState(calificacionesMock)
  const [cerrandoSesion, setCerrandoSesion] = useState(false)
  const [errorSesion, setErrorSesion] = useState('')

  const { usuario, autenticado, cargando, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const esInicio = location.pathname === '/'

  function handleModerar(id, motivo) {
    const hoy = new Date().toLocaleDateString('en-CA')

    setCalificaciones((anteriores) =>
      moderarCalificacion(anteriores, id, motivo, hoy)
    )
  }

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

  const panelAdministracion = (
    <PanelAdministracion
      prestadores={prestadoresMock}
      calificaciones={calificaciones}
      onModerar={handleModerar}
    />
  )

  return (
    <>
      <header>
        <h1>ServiMap</h1>

        <NavegacionRoles />

        {cargando ? (
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
        ) : null}

        {errorSesion && <p role="alert">{errorSesion}</p>}
      </header>

      <AppRoutes panelAdministracion={panelAdministracion} />

      {esInicio && (
        <main>
          <h2>Encontrá prestadores de servicios</h2>
          <p>Buscá profesionales disponibles en ServiMap.</p>

          <BuscadorPrestadores
            prestadores={prestadoresMock}
            calificaciones={calificaciones}
          />

          <p>
            <Link to="/login">Acceder a mi cuenta</Link>
          </p>
        </main>
      )}
    </>
  )
}

export default App

