
import { Link } from 'react-router-dom'

function AccesoDenegado() {
  return (
    <section>
      <h1>Acceso denegado</h1>
      <p>
        No tenés permisos para acceder a esta sección de ServiMap.
      </p>
      <Link to="/">Volver al inicio</Link>
    </section>
  )
}

export default AccesoDenegado
