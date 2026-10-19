import { Routes, Route } from 'react-router-dom'
import Registro from '../pages/Registro'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/registro" element={<Registro />} />
    </Routes>
  )
}

export default AppRoutes
