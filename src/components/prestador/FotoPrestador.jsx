import { useState } from 'react'
import './FotoPrestador.css'

export function FotoPrestador({ prestador, respaldo }) {
  const [fallida, setFallida] = useState(false)
  let url
  try {
    const candidata = new URL(prestador.fotoPerfil)
    if (['https:', 'http:'].includes(candidata.protocol)) url = prestador.fotoPerfil
  } catch { /* Sin URL absoluta documentada, conservar el avatar. */ }

  return url && !fallida
    ? <img className="foto-prestador" src={url} alt="" onError={() => setFallida(true)} />
    : respaldo
}
