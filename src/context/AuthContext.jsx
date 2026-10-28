import { useCallback, useEffect, useRef, useState } from 'react'
import { AuthContext } from './authContextInstance'
import {
  iniciarSesion,
  cerrarSesion,
  obtenerSesion,
} from '../services/authService'

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [sesionExpirada, setSesionExpirada] = useState(false)
  const version = useRef(0)

  useEffect(() => {
    const actual = ++version.current

    obtenerSesion()
      .then((sesion) => {
        if (actual === version.current) {
          setUsuario(sesion)
        }
      })
      .catch(() => {
        if (actual === version.current) {
          setUsuario(null)
        }
      })
      .finally(() => {
        if (actual === version.current) {
          setCargando(false)
        }
      })

    return () => {
      version.current += 1
    }
  }, [])

  const revalidarSesion = useCallback(async () => {
    const actual = version.current
    const sesion = await obtenerSesion()

    if (actual !== version.current) {
      return null
    }

    if (!sesion) {
      setUsuario(null)
      setSesionExpirada(true)
      return null
    }

    setUsuario(sesion)
    setSesionExpirada(false)
    return sesion
  }, [])

  async function login(email, contrasena) {
    const sesion = await iniciarSesion(email, contrasena)

    version.current += 1
    setUsuario(sesion)
    setSesionExpirada(false)
    setCargando(false)
    return sesion
  }

  async function logout() {
    await cerrarSesion()

    version.current += 1
    setUsuario(null)
    setSesionExpirada(false)
    setCargando(false)
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        login,
        logout,
        revalidarSesion,
        sesionExpirada,
        autenticado: Boolean(usuario),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
