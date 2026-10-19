import './App.css'
import AppRoutes from './routes/AppRoutes'
import { BuscadorPrestadores } from './components/BuscadorPrestadores'
import { calificacionesMock } from './data/calificacionesMock'
import { prestadoresMock } from './data/prestadoresMock'

function App() {
  return (
    <>
      <AppRoutes />

      <BuscadorPrestadores
        prestadores={prestadoresMock}
        calificaciones={calificacionesMock}
      />
    </>
  )
}

export default App