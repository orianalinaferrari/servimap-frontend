import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { tieneRol } from '../../utils/roles'

function RutaProtegida({ rolesPermitidos, children }) {
  const {
    usuario,
    cargando,
    revalidarSesion,
    sesionExpirada,
  } = useAuth()

  const location = useLocation()
  const rutaActual = location.pathname
  const [intento, setIntento] = useState(0)
  const [revision, setRevision] = useState({
    ruta: null,
    estado: 'pendiente',
  })

  const autorizado = tieneRol(usuario, rolesPermitidos)
  const requiereRevision = Boolean(
    usuario && autorizado && revalidarSesion
  )

  useEffect(() => {
    if (cargando || !requiereRevision) return

    let vigente = true

    revalidarSesion()
      .then(() => {
        if (vigente) {
          setRevision({
            ruta: rutaActual,
            estado: 'completada',
          })
        }
      })
      .catch(() => {
        if (vigente) {
          setRevision({
            ruta: rutaActual,
            estado: 'error',
          })
        }
      })

    return () => {
      vigente = false
    }
  }, [
    cargando,
    requiereRevision,
    revalidarSesion,
    rutaActual,
    intento,
  ])

  if (cargando) {
    return <p role="status">Verificando sesión...</p>
  }

  if (!usuario) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: rutaActual,
          sesionExpirada: Boolean(sesionExpirada),
        }}
      />
    )
  }

  if (!autorizado) {
    return <Navigate to="/acceso-denegado" replace />
  }

  if (requiereRevision) {
    if (revision.ruta !== rutaActual ||
        revision.estado === 'pendiente') {
      return <p role="status">Verificando sesión...</p>
    }

    if (revision.estado === 'error') {
      return (
        <section role="alert">
          <p>No se pudo verificar la sesión con el servidor.</p>
          <button
            type="button"
            onClick={() => {
              setRevision({
                ruta: rutaActual,
                estado: 'pendiente',
              })
              setIntento((anterior) => anterior + 1)
            }}
          >
            Reintentar verificación
          </button>
        </section>
      )
    }
  }

  return children
}

export default RutaProtegida
