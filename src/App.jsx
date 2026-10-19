import './App.css'
import { BuscadorPrestadores } from './components/BuscadorPrestadores'
import { calificacionesMock } from './data/calificacionesMock'
import { prestadoresMock } from './data/prestadoresMock'

function App() {
  return (
    <main>
      <h1>ServiMap</h1>
      <p>Frontend de ServiMap</p>
      <BuscadorPrestadores
        prestadores={prestadoresMock}
        calificaciones={calificacionesMock}
      />
    </main>
  )
}

export default App