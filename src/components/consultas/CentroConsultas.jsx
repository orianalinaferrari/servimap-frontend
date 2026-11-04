import { Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { consultasNoDisponibles, servicioConsultasDisponible } from '../../services/consultasService'
import { puedeUsarConsultas } from '../../utils/consultasAyuda'
import BandejaConsultas from './BandejaConsultas'
import '../../styles/ConsultasAyuda.css'

function ConsultasConSesion({ servicio, administracion }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return <p role="status">Verificando sesión...</p>
  if (!usuario) return <p>Iniciá sesión para consultar tus mensajes. <Link to="/login">Ir a iniciar sesión</Link></p>
  if (!puedeUsarConsultas(usuario, administracion)) return <p role="alert">Tu rol no tiene acceso a esta sección de consultas.</p>
  return <BandejaConsultas key={`${usuario.id}:${usuario.rol}:${administracion}`} servicio={servicio} usuario={usuario} administracion={administracion} />
}

export default function CentroConsultas({ servicio = consultasNoDisponibles, administracion = false }) {
  return <section className="centro-consultas" aria-label={administracion ? 'Bandeja de consultas' : 'Consultas al administrador'}>
    <h2>{administracion ? 'Consultas recibidas' : 'Consultas al administrador'}</h2>
    {servicioConsultasDisponible(servicio) ? <ConsultasConSesion servicio={servicio} administracion={administracion} /> : <p role="note">Las consultas directas al administrador aún no están disponibles. Por ahora podés consultar las preguntas frecuentes de Ayuda. No se reciben ni guardan mensajes desde esta sección.</p>}
  </section>
}
