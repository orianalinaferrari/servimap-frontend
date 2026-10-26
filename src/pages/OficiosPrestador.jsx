import { useState } from 'react'
import { useAuth } from '../context/useAuth'
import {
  OFICIOS_PERMITIDOS,
  obtenerOficiosValidos,
} from '../utils/oficiosPrestador'
import { crearPerfilInicial } from '../utils/perfilPrestador'

function cargarPerfil(usuario) {
  const inicial = crearPerfilInicial(usuario)

  if (usuario?.id == null) {
    return inicial
  }

  try {
    const guardado = localStorage.getItem(
      `servimap-perfil-${usuario.id}`
    )

    return guardado
      ? { ...inicial, ...JSON.parse(guardado) }
      : inicial
  } catch {
    return inicial
  }
}

export default function OficiosPrestador() {
  const { usuario } = useAuth()

  const [oficios, setOficios] = useState(() =>
    obtenerOficiosValidos(cargarPerfil(usuario).oficios)
  )

  const [seleccion, setSeleccion] = useState('')
  const [mensaje, setMensaje] = useState('')

  function agregarOficio() {
    if (!seleccion) {
      setMensaje('Seleccioná un oficio')
      return
    }

    if (oficios.includes(seleccion)) {
      setMensaje('Ese oficio ya está agregado')
      return
    }

    setOficios((anteriores) => [...anteriores, seleccion])
    setSeleccion('')
    setMensaje('')
  }

  function quitarOficio(oficio) {
    setOficios((anteriores) =>
      anteriores.filter((actual) => actual !== oficio)
    )
    setMensaje('')
  }

  function guardarOficios() {
    if (usuario?.id == null) {
      setMensaje('No se pudo identificar al prestador')
      return
    }

    if (oficios.length === 0) {
      setMensaje('Debés tener al menos un oficio')
      return
    }

    try {
      const perfil = cargarPerfil(usuario)

      const actualizado = {
        ...perfil,
        oficios: oficios.join(', '),
      }

      localStorage.setItem(
        `servimap-perfil-${usuario.id}`,
        JSON.stringify(actualizado)
      )

      setMensaje('Oficios guardados en este navegador')
    } catch {
      setMensaje('No se pudieron guardar los oficios')
    }
  }

  return (
    <main>
      <h1>Mis oficios</h1>

      <p>
        Administrá los oficios que ofrecés en ServiMap.
      </p>

      <h2>Oficios asociados</h2>

      {oficios.length === 0 ? (
        <p>No tenés oficios seleccionados.</p>
      ) : (
        <ul>
          {oficios.map((oficio) => (
            <li key={oficio}>
              {oficio}{' '}
              <button
                type="button"
                onClick={() => quitarOficio(oficio)}
                aria-label={`Quitar ${oficio}`}
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      <div>
        <label htmlFor="nuevo-oficio">
          Seleccionar oficio
        </label>

        <select
          id="nuevo-oficio"
          value={seleccion}
          onChange={(evento) =>
            setSeleccion(evento.target.value)
          }
        >
          <option value="">Elegí un oficio</option>

          {OFICIOS_PERMITIDOS.map((oficio) => (
            <option key={oficio} value={oficio}>
              {oficio}
            </option>
          ))}
        </select>

        <button type="button" onClick={agregarOficio}>
          Agregar oficio
        </button>
      </div>

      <button type="button" onClick={guardarOficios}>
        Guardar oficios
      </button>

      {mensaje && <p role="status">{mensaje}</p>}
    </main>
  )
}
