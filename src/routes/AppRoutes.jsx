import { Routes, Route } from 'react-router-dom'
import Registro from '../pages/Registro'
import Login from '../pages/Login'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={null} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  )
}

export default AppRoutes
