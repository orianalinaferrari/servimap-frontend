import { Link } from 'react-router-dom'

function PaginaNoEncontrada() {
  return (
    <section>
      <h1>Página no encontrada</h1>
      <p>La dirección que buscás no existe en ServiMap.</p>
      <Link to="/">Volver al inicio</Link>
    </section>
  )
}

export default PaginaNoEncontrada