import { IconoPrestador as IconoCliente } from '../prestador/IconoPrestador'

export function EstrellasCalificacion({ puntaje }) {
  return <span className="cliente-estrellas" aria-hidden="true">
    {[1, 2, 3, 4, 5].map((valor) => <IconoCliente key={valor} tipo="estrella" className={valor <= puntaje ? '' : 'sin-puntaje'} />)}
  </span>
}
