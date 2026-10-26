
import { useState } from 'react'
import './App.css'
import AppRoutes from './routes/AppRoutes'
import { BuscadorPrestadores } from './components/BuscadorPrestadores'
import { PanelAdministracion } from './components/PanelAdministracion'
import { calificacionesMock } from './data/calificacionesMock'
import { prestadoresMock } from './data/prestadoresMock'
import { moderarCalificacion } from './utils/reputacion'
import { useAuth } from './context/useAuth'

function App() {
  const [vista, setVista] = useState('busqueda')
  const [calificaciones, setCalificaciones] = useState(calificacionesMock)
  const { usuario, autenticado, cargando, logout } = useAuth()
  const [cerrandoSesion, setCerrandoSesion] = useState(false)
  const [errorSesion, setErrorSesion] = useState('')

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
      setVista('busqueda')
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

  return (
    <>
      <AppRoutes />

      <main>
        <h1>ServiMap</h1>
        <p>Frontend de ServiMap</p>

        <div>
          {cargando ? (
            <p>Verificando sesión...</p>
          ) : autenticado ? (
            <>
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
            </>
          ) : (
            <p>
              <a href="/login">Iniciar sesión</a>
            </p>
          )}
        </div>

        {errorSesion && <p role="alert">{errorSesion}</p>}

        <nav aria-label="Navegación principal">
          <button
            type="button"
            aria-pressed={vista === 'busqueda'}
            onClick={() => setVista('busqueda')}
          >
            Buscar prestadores
          </button>

          <button
            type="button"
            aria-pressed={vista === 'admin'}
            onClick={() => setVista('admin')}
          >
            Administración
          </button>
        </nav>

        {vista === 'busqueda' && (
          <BuscadorPrestadores
            prestadores={prestadoresMock}
            calificaciones={calificaciones}
          />
        )}

        {vista === 'admin' && (
          <PanelAdministracion
            prestadores={prestadoresMock}
            calificaciones={calificaciones}
            onModerar={handleModerar}
          />
        )}
      </main>
    </>
  )
}

export default App
