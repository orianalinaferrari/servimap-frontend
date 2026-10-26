import { Link } from 'react-router-dom'

function PanelPrestador() {
  return (
    <section>
      <h1>Panel del prestador</h1>
      <p>Bienvenido al espacio de prestadores de ServiMap.</p>
      <p>
        Esta sección reúne los accesos correspondientes
        al rol Prestador.
      </p>

      <nav aria-label="Opciones del prestador">
        <p>
          <Link to="/prestador/perfil">Mi perfil</Link>
        </p>
        <p>
          <Link to="/prestador/oficios">Mis oficios</Link>
        </p>
        <p>
          <Link to="/prestador/solicitudes">Solicitudes recibidas</Link>
        </p>
      </nav>
    </section>
  )
}

export default PanelPrestador
