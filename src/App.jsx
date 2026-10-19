import { useState } from 'react'
import './App.css'
import AppRoutes from './routes/AppRoutes'
import { BuscadorPrestadores } from './components/BuscadorPrestadores'
import { PanelAdministracion } from './components/PanelAdministracion'
import { calificacionesMock } from './data/calificacionesMock'
import { prestadoresMock } from './data/prestadoresMock'

function App() {
  const [vista, setVista] = useState('busqueda')

  return (
    <>
      <AppRoutes />

      <main>
        <h1>ServiMap</h1>
        <p>Frontend de ServiMap</p>

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
            calificaciones={calificacionesMock}
          />
        )}

        {vista === 'admin' && <PanelAdministracion />}
      </main>
    </>
  )
}

export default App
