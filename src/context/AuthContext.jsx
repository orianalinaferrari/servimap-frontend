
import { useEffect, useState } from 'react'
import { AuthContext } from './authContextInstance' 
import {
  iniciarSesion,
  cerrarSesion,
  obtenerSesion,
} from '../services/authService'


export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true

    async function verificarSesion() {
      try {
        const sesion = await obtenerSesion()

        if (activo) {
          setUsuario(sesion)
        }
      } catch {
        if (activo) {
          setUsuario(null)
        }
      } finally {
        if (activo) {
          setCargando(false)
        }
      }
    }

    verificarSesion()

    return () => {
      activo = false
    }
  }, [])

  async function login(email, contrasena) {
    const usuarioAutenticado = await iniciarSesion(
      email,
      contrasena
    )

    setUsuario(usuarioAutenticado)
    return usuarioAutenticado
  }

  async function logout() {
    await cerrarSesion()
    setUsuario(null)
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        login,
        logout,
        autenticado: Boolean(usuario),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

