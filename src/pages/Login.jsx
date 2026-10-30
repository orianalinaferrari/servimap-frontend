
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import '../styles/Login.css'
import CampoContrasena from '../components/CampoContrasena'
import { esEmailValido } from '../utils/email'
import { resolverDestinoPostLogin } from '../services/destinoPostLogin'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [formulario, setFormulario] = useState({
    email: '',
    contrasena: '',
  })

  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [enviando, setEnviando] = useState(false)

  const manejarCambio = (evento) => {
    const { name, value } = evento.target

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }))

    setErrores((anterior) => ({
      ...anterior,
      [name]: '',
    }))

    setErrorServidor('')
  }

  const validarFormulario = () => {
    const nuevosErrores = {}

    if (!formulario.email.trim()) {
      nuevosErrores.email = 'El email es obligatorio'
    } else if (!esEmailValido(formulario.email)) {
      nuevosErrores.email = 'Ingresá un email válido'
    }

    if (!formulario.contrasena) {
      nuevosErrores.contrasena = 'La contraseña es obligatoria'
    }

    setErrores(nuevosErrores)

    return Object.keys(nuevosErrores).length === 0
  }

  const manejarEnvio = async (evento) => {
    evento.preventDefault()

    if (enviando || !validarFormulario()) {
      return
    }

    setErrorServidor('')
    setEnviando(true)

    try {
      const usuario = await login(
        formulario.email.trim(),
        formulario.contrasena
      )

      await navigate(
        await resolverDestinoPostLogin(usuario, location.state?.from),
        { replace: true }
      )
    } catch (error) {
      setErrorServidor(
        error instanceof Error
          ? error.message
          : 'No se pudo iniciar sesión. Intentá nuevamente.'
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="login-pagina">
      <div className="login-tarjeta">
        <h1>Iniciar sesión</h1>
        <p>Ingresá tus datos para acceder a ServiMap.</p>

        <form onSubmit={manejarEnvio} noValidate>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formulario.email}
            onChange={manejarCambio}
            aria-invalid={Boolean(errores.email)}
          />
          {errores.email && (
            <p role="alert">{errores.email}</p>
          )}

          <label htmlFor="contrasena">Contraseña</label>
          <CampoContrasena
            id="contrasena"
            name="contrasena"
            autoComplete="current-password"
            value={formulario.contrasena}
            onChange={manejarCambio}
            aria-invalid={Boolean(errores.contrasena)}
          />
          {errores.contrasena && (
            <p role="alert">{errores.contrasena}</p>
          )}

          {errorServidor && (
            <p role="alert">{errorServidor}</p>
          )}

          <button type="submit" disabled={enviando}>
            {enviando ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p>
          ¿Todavía no tenés cuenta?{' '}
          <Link to="/registro">Crear cuenta</Link>
        </p>
      </div>
    </main>
  )
}

export default Login

