import { useState } from 'react'
import './App.css'
import { BuscadorPrestadores } from './components/BuscadorPrestadores'
import { PanelAdministracion } from './components/PanelAdministracion'
import { calificacionesMock } from './data/calificacionesMock'
import { prestadoresMock } from './data/prestadoresMock'
import { moderarCalificacion } from './utils/reputacion'

function App() {
  const [vista, setVista] = useState('busqueda')
  const [calificaciones, setCalificaciones] = useState(calificacionesMock)

  function handleModerar(id, motivo) {
    const hoy = new Date().toLocaleDateString('en-CA')
    setCalificaciones(moderarCalificacion(calificaciones, id, motivo, hoy))
  }

  return (
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
        <BuscadorPrestadores prestadores={prestadoresMock} calificaciones={calificaciones} />
      )}
      {vista === 'admin' && (
        <PanelAdministracion
          prestadores={prestadoresMock}
          calificaciones={calificaciones}
          onModerar={handleModerar}
        />
      )}
    </main>
  )
}

export default App