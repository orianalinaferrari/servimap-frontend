import { useState } from 'react'
import { filtrarPrestadores } from '../utils/filtrarPrestadores'
import { DetallePrestador } from './DetallePrestador'

export function BuscadorPrestadores({ prestadores, calificaciones = [] }) {
  const [termino, setTermino] = useState('')
  const [prestadorSeleccionadoId, setPrestadorSeleccionadoId] = useState(null)

  const resultados = filtrarPrestadores(prestadores, termino)

  const prestadorSeleccionado = prestadores.find(
    (prestador) => prestador.id === prestadorSeleccionadoId
  )

  if (prestadorSeleccionado) {
    return (
      <DetallePrestador
        prestador={prestadorSeleccionado}
        calificaciones={calificaciones}
        onVolver={() => setPrestadorSeleccionadoId(null)}
      />
    )
  }

  return (
    <section className="buscador">
      <div className="buscador-campo">
        <label htmlFor="busqueda">Buscar prestador</label>
        <input
          id="busqueda"
          type="text"
          value={termino}
          onChange={(evento) => setTermino(evento.target.value)}
          placeholder="Nombre, oficio o zona"
        />
      </div>

      {resultados.length === 0 ? (
        <p>No se encontraron prestadores para "{termino}"</p>
      ) : (
        <ul className="lista-prestadores">
          {resultados.map((prestador) => (
            <li key={prestador.id} className="tarjeta-prestador">
              <h3>
                <button
                  type="button"
                  className="boton-nombre"
                  onClick={() => setPrestadorSeleccionadoId(prestador.id)}
                >
                  {prestador.nombre}
                </button>
              </h3>
              <p>{prestador.oficios.join(', ')}</p>
              <p>{prestador.zonaCobertura}</p>
              <p className="tarjeta-precio">
                ${prestador.precioMin.toLocaleString('es-AR')} – $
                {prestador.precioMax.toLocaleString('es-AR')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}