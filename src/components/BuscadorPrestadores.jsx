import { useState } from 'react'
import { filtrarPrestadores } from '../utils/filtrarPrestadores'

export function BuscadorPrestadores({ prestadores }) {
  const [termino, setTermino] = useState('')

  const resultados = filtrarPrestadores(prestadores, termino)

  return (
    <section>
      <label htmlFor="busqueda">Buscar prestador</label>
      <input
        id="busqueda"
        type="text"
        value={termino}
        onChange={(evento) => setTermino(evento.target.value)}
        placeholder="Nombre, oficio o zona"
      />
    </section>
  )
}