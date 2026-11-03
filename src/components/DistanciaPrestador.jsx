import { textoDistancia } from '../utils/distancias'

export function DistanciaPrestador({ referencia, prestador }) {
  const texto = textoDistancia(referencia, prestador)
  return texto ? <p className="distancia-prestador">{texto}</p> : null
}
