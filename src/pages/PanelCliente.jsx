
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
      <Link to="/">Buscar prestadores</Link>
    </section>
  )
}

export default PanelCliente
