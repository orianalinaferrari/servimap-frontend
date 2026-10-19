import './App.css'
import AppRoutes from './routes/AppRoutes'
import { BuscadorPrestadores } from './components/BuscadorPrestadores'
import { prestadoresMock } from './data/prestadoresMock'

function App() {
  return (
    <>
      <AppRoutes />

      <BuscadorPrestadores prestadores={prestadoresMock} />
    </>
  )
}

export default App