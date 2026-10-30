import { Link } from 'react-router-dom'
import { IconoPrestador as IconoCliente } from '../components/prestador/IconoPrestador'

function PanelCliente() {
  return (
    <main className="cliente-pagina cliente-panel">
      <header className="cliente-titulo">
        <p className="cliente-etiqueta">ESPACIO DEL CLIENTE</p>
        <h1>Panel del cliente</h1>
        <p>Bienvenido al espacio de clientes de ServiMap.</p>
      </header>

      <nav className="cliente-accesos" aria-label="Opciones del cliente">
        <Link className="cliente-tarjeta cliente-acceso" to="/prestadores" aria-label="Buscar prestadores">
          <span className="cliente-icono-suave"><IconoCliente tipo="herramienta" /></span>
          <h2>Buscar prestadores</h2>
          <p>Explorá los servicios disponibles y elegí al profesional para tu próximo trabajo.</p>
          <span className="cliente-acceso-enlace">Explorar servicios <span aria-hidden="true">→</span></span>
        </Link>
        <Link className="cliente-tarjeta cliente-acceso" to="/cliente/solicitudes" aria-label="Mis solicitudes">
          <span className="cliente-icono-suave"><IconoCliente tipo="solicitudes" /></span>
          <h2>Mis solicitudes</h2>
          <p>Consultá tus pedidos, revisá sus detalles y calificá los servicios finalizados.</p>
          <span className="cliente-acceso-enlace">Ver mis solicitudes <span aria-hidden="true">→</span></span>
        </Link>
      </nav>
    </main>
  )
}

export default PanelCliente
