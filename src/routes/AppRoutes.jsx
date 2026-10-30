
import { Routes, Route } from 'react-router-dom'
import Registro from '../pages/Registro'
import Login from '../pages/Login'
import PanelCliente from '../pages/PanelCliente'
import SolicitudesCliente from '../pages/SolicitudesCliente'
import PanelPrestador from '../pages/PanelPrestador'
import SolicitudesPrestador from '../pages/SolicitudesPrestador'
import AccesoDenegado from '../pages/AccesoDenegado'
import RutaProtegida from '../components/auth/RutaProtegida'
import { ROLES } from '../utils/roles'
import PerfilPrestador from '../pages/PerfilPrestador'
import PaginaNoEncontrada from '../pages/PaginaNoEncontrada'
import OficiosPrestador from '../pages/OficiosPrestador'
import PerfilCliente from '../pages/PerfilCliente'
import CompletarPerfilPrestador from '../pages/CompletarPerfilPrestador'
import DirectorioPrestadores from '../components/DirectorioPrestadores'
import '../styles/DirectorioPrestadores.css'

function AppRoutes({ panelAdministracion }) {
  return (
    <Routes>
      <Route path="/" element={null} />
      <Route path="/prestadores" element={<main className="inicio directorio-pagina"><div className="inicio-presentacion"><h1>Encontrá prestadores de servicios</h1><p>Buscá profesionales disponibles en ServiMap.</p></div><DirectorioPrestadores /></main>} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/cliente"
        element={
          <RutaProtegida rolesPermitidos={[ROLES.CLIENTE]}>
            <PanelCliente />
          </RutaProtegida>
        }
      />
      <Route
        path="/cliente/solicitudes"
        element={
          <RutaProtegida rolesPermitidos={[ROLES.CLIENTE]}>
            <SolicitudesCliente />
          </RutaProtegida>
        }
      />
      <Route
        path="/cliente/perfil"
        element={
          <RutaProtegida rolesPermitidos={[ROLES.CLIENTE]}>
            <PerfilCliente />
          </RutaProtegida>
        }
      />

      <Route
        path="/prestador"
        element={
          <RutaProtegida rolesPermitidos={[ROLES.PRESTADOR]}>
            <PanelPrestador />
          </RutaProtegida>
        }
      />

      <Route
        path="/prestador/solicitudes"
        element={
          <RutaProtegida rolesPermitidos={[ROLES.PRESTADOR]}>
            <SolicitudesPrestador />
          </RutaProtegida>
        }
      />
      <Route
        path="/prestador/perfil"
        element={
          <RutaProtegida rolesPermitidos={[ROLES.PRESTADOR]}>
            <PerfilPrestador />
          </RutaProtegida>
        }
      />
      <Route
        path="/prestador/completar-perfil"
        element={
          <RutaProtegida rolesPermitidos={[ROLES.PRESTADOR]}>
            <CompletarPerfilPrestador />
          </RutaProtegida>
        }
      />
      <Route
        path="/prestador/oficios"
        element={
          <RutaProtegida rolesPermitidos={[ROLES.PRESTADOR]}>
            <OficiosPrestador />
          </RutaProtegida>
        }
      />

      <Route
        path="/admin"
        element={
          <RutaProtegida rolesPermitidos={[ROLES.ADMINISTRADOR]}>
            {panelAdministracion}
          </RutaProtegida>
        }
      />

      <Route
        path="/acceso-denegado"
        element={<AccesoDenegado />}
      />

      <Route
        path="*"
        element={<PaginaNoEncontrada />}
      />
    </Routes>
  )
}

export default AppRoutes
