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
            {resultados.length === 0 ? (
                <p>No se encontraron prestadores para "{termino}"</p>
            ) : (
                <ul>
                    {resultados.map((prestador) => (
                        <li key={prestador.id}>
                            <h3>{prestador.nombre}</h3>
                            <p>{prestador.oficios.join(', ')}</p>
                            <p>{prestador.zonaCobertura}</p>
                            <p>
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