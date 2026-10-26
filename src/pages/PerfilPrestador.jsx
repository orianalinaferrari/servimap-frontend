
import { useState } from 'react'
import { useAuth } from '../context/useAuth'
import { VistaPerfilPrestador } from '../components/prestador/VistaPerfilPrestador'
import { FormularioPerfilPrestador } from '../components/prestador/FormularioPerfilPrestador'
import { crearPerfilInicial } from '../utils/perfilPrestador'

function obtenerPerfil(usuario) {
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

export default function PerfilPrestador() {
  const { usuario } = useAuth()

  const [perfil, setPerfil] = useState(() =>
    obtenerPerfil(usuario)
  )

  const [editando, setEditando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  function guardarPerfil(nuevosDatos) {
    if (usuario?.id == null) {
      setMensaje('No se pudo identificar al prestador.')
      return
    }

    try {
      const perfilActual = obtenerPerfil(usuario)

      const perfilActualizado = {
        ...perfilActual,
        ...nuevosDatos,
        oficios: perfilActual.oficios,
      }

      localStorage.setItem(
        `servimap-perfil-${usuario.id}`,
        JSON.stringify(perfilActualizado)
      )

      setPerfil(perfilActualizado)
      setEditando(false)
      setMensaje('Cambios guardados en este navegador.')
    } catch {
      setMensaje('No se pudieron guardar los cambios.')
    }
  }

  return (
    <main>
      {mensaje && <p role="status">{mensaje}</p>}

      {editando ? (
        <FormularioPerfilPrestador
          perfil={perfil}
          onGuardar={guardarPerfil}
          onCancelar={() => setEditando(false)}
        />
      ) : (
        <VistaPerfilPrestador
          perfil={perfil}
          onEditar={() => {
            setMensaje('')
            setEditando(true)
          }}
        />
      )}
    </main>
  )
}
