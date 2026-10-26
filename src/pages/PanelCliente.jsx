import { Link } from 'react-router-dom'

function PanelCliente() {
  return (
    <section>
      <h1>Panel del cliente</h1>
      <p>Bienvenido al espacio de clientes de ServiMap.</p>
      <p>
        Desde acá vas a poder acceder a las funcionalidades
        disponibles para tu rol.
      </p>

      <nav aria-label="Opciones del cliente">
        <p>
          <Link to="/">Buscar prestadores</Link>
        </p>
        <p>
          <Link to="/cliente/solicitudes">Mis solicitudes</Link>
        </p>
      </nav>
    </section>
  )
}

export default PanelCliente
