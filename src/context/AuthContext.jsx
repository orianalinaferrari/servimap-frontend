import { useCallback, useEffect, useRef, useState } from 'react'
import { AuthContext } from './authContextInstance'
import { EVENTO_SESION_EXPIRADA, expiracionToken, obtenerToken } from '../services/sesionToken'
import { EVENTO_PERFIL_PRESTADOR_ACTUALIZADO, obtenerMiPerfil } from '../services/prestadoresService'
import { normalizarRol, ROLES } from '../utils/roles'
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
  const [fotoSesion, setFotoSesion] = useState(null)
  const esPrestador = normalizarRol(usuario?.rol) === ROLES.PRESTADOR

  useEffect(() => {
    if (normalizarRol(usuario?.rol) !== ROLES.PRESTADOR || !usuario?.id) return
    const usuarioId = usuario.id
    const token = obtenerToken()
    if (!token) return
    let activo = true
    let actualizado = false
    const sesionActual = version.current
    const vigente = () => activo && version.current === sesionActual && obtenerToken() === token
    const sincronizar = (perfil) => {
      if (vigente()) setFotoSesion({ usuarioId, fotoPerfil: perfil?.fotoPerfil ?? '' })
    }
    const alGuardar = ({ detail }) => { actualizado = true; sincronizar(detail) }
    window.addEventListener(EVENTO_PERFIL_PRESTADOR_ACTUALIZADO, alGuardar)
    obtenerMiPerfil().then((perfil) => { if (!actualizado) sincronizar(perfil) }).catch(() => {
      // Una foto no disponible no invalida la sesión ni bloquea las rutas.
    })
    return () => { activo = false; window.removeEventListener(EVENTO_PERFIL_PRESTADOR_ACTUALIZADO, alGuardar) }
  }, [usuario])

  useEffect(() => {
    const expirar = () => {
      version.current += 1
      setUsuario(null)
      setFotoSesion(null)
      setSesionExpirada(true)
      setCargando(false)
    }
    window.addEventListener(EVENTO_SESION_EXPIRADA, expirar)
    const token = obtenerToken()
    const restante = token ? expiracionToken(token) - Date.now() : 0
    const temporizador = restante > 0 ? setTimeout(() => {
      // La lectura elimina el token vencido y notifica a todas las vistas.
      obtenerToken()
    }, Math.min(restante + 10, 2147483647)) : null
    return () => {
      clearTimeout(temporizador)
      window.removeEventListener(EVENTO_SESION_EXPIRADA, expirar)
    }
  }, [usuario])

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
      setFotoSesion(null)
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
    setFotoSesion(null)
    setUsuario(sesion)
    setSesionExpirada(false)
    setCargando(false)
    return sesion
  }

  async function logout() {
    await cerrarSesion()

    version.current += 1
    setFotoSesion(null)
    setUsuario(null)
    setSesionExpirada(false)
    setCargando(false)
  }

  return (
    <AuthContext.Provider
      value={{
        usuario: usuario && esPrestador ? { ...usuario, fotoPerfil: fotoSesion?.usuarioId === usuario.id ? fotoSesion.fotoPerfil : '' } : usuario,
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
