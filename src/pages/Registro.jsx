import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import CampoContrasena from '../components/auth/CampoContrasena'
import '../styles/Registro.css'

function Registro() {
  const [parametros] = useSearchParams()
  const rolSeleccionado = parametros.get('rol')
  const [formulario, setFormulario] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    contrasena: '',
    confirmarContrasena: '',
    rol: ['CLIENTE', 'PRESTADOR'].includes(rolSeleccionado) ? rolSeleccionado : '',
  })

  const manejarCambio = (evento) => {
    const { name, value } = evento.target

    setFormulario({
      ...formulario,
      [name]: value,
    })
  }

  const [errores, setErrores] = useState({})

  const validarFormulario = () => {
    const nuevosErrores = {}

    if (!formulario.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio'
    }

    if (!formulario.apellido.trim()) {
      nuevosErrores.apellido = 'El apellido es obligatorio'
    }

    if (!formulario.email.trim()) {
      nuevosErrores.email = 'El email es obligatorio'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.email)) {
      nuevosErrores.email = 'Ingresá un email válido'
    }

    if (!formulario.telefono.trim()) {
      nuevosErrores.telefono = 'El teléfono es obligatorio'
    }

    if (!formulario.contrasena) {
      nuevosErrores.contrasena = 'La contraseña es obligatoria'
    }

    if (!formulario.confirmarContrasena) {
      nuevosErrores.confirmarContrasena = 'Confirmá tu contraseña'
    } else if (formulario.contrasena !== formulario.confirmarContrasena) {
      nuevosErrores.confirmarContrasena = 'Las contraseñas no coinciden'
    }

    if (!formulario.rol) {
      nuevosErrores.rol = 'Seleccioná un tipo de usuario'
    }

    setErrores(nuevosErrores)

    return Object.keys(nuevosErrores).length === 0
  }

  const manejarEnvio = (evento) => {
    evento.preventDefault()

    const formularioValido = validarFormulario()

    if (!formularioValido) {
      return
    }

    // La conexión con el servicio de registro se agregará después.
  }

  return (
    <main className="registro-pagina">
      <h1>Crear cuenta</h1>
      <p>Completá tus datos para registrarte en ServiMap.</p>

      <form
        className="registro-formulario"
        onSubmit={manejarEnvio}
        noValidate
      >
        <label htmlFor="nombre">Nombre</label>
        <input
          id="nombre"
          name="nombre"
          aria-invalid={Boolean(errores.nombre)}
          aria-describedby={errores.nombre ? 'nombre-error' : undefined}
          autoComplete="given-name"
          type="text"
          value={formulario.nombre}
          onChange={manejarCambio}
        />
        {errores.nombre && <p id="nombre-error" role="alert">{errores.nombre}</p>}

        <label htmlFor="apellido">Apellido</label>
        <input
          id="apellido"
          name="apellido"
          aria-invalid={Boolean(errores.apellido)}
          aria-describedby={errores.apellido ? 'apellido-error' : undefined}
          autoComplete="family-name"
          type="text"
          value={formulario.apellido}
          onChange={manejarCambio}
        />
        {errores.apellido && <p id="apellido-error" role="alert">{errores.apellido}</p>}

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          aria-invalid={Boolean(errores.email)}
          aria-describedby={errores.email ? 'email-error' : undefined}
          autoComplete="email"
          type="email"
          value={formulario.email}
          onChange={manejarCambio}
        />
        {errores.email && <p id="email-error" role="alert">{errores.email}</p>}

        <label htmlFor="telefono">Teléfono</label>
        <input
          id="telefono"
          name="telefono"
          aria-invalid={Boolean(errores.telefono)}
          aria-describedby={errores.telefono ? 'telefono-error' : undefined}
          autoComplete="tel"
          type="tel"
          value={formulario.telefono}
          onChange={manejarCambio}
        />
        {errores.telefono && <p id="telefono-error" role="alert">{errores.telefono}</p>}

        <label htmlFor="contrasena">Contraseña</label>
        <CampoContrasena
          id="contrasena"
          name="contrasena"
          aria-invalid={Boolean(errores.contrasena)}
          aria-describedby={errores.contrasena ? 'contrasena-error' : undefined}
          autoComplete="new-password"
          value={formulario.contrasena}
          onChange={manejarCambio}
        />
        {errores.contrasena && <p id="contrasena-error" role="alert">{errores.contrasena}</p>}

        <label htmlFor="confirmarContrasena">Confirmar contraseña</label>
        <CampoContrasena
          id="confirmarContrasena"
          name="confirmarContrasena"
          aria-invalid={Boolean(errores.confirmarContrasena)}
          aria-describedby={errores.confirmarContrasena ? 'confirmarContrasena-error' : undefined}
          autoComplete="new-password"
          value={formulario.confirmarContrasena}
          onChange={manejarCambio}
        />
        {errores.confirmarContrasena && <p id="confirmarContrasena-error" role="alert">{errores.confirmarContrasena}</p>}

        <label htmlFor="rol">Tipo de usuario</label>
        <select
          id="rol"
          name="rol"
          aria-invalid={Boolean(errores.rol)}
          aria-describedby={errores.rol ? 'rol-error' : undefined}
          value={formulario.rol}
          onChange={manejarCambio}
        >

          <option value="">Seleccionar</option>
          <option value="CLIENTE">Cliente</option>
          <option value="PRESTADOR">Prestador</option>
        </select>
        
        {errores.rol && <p id="rol-error" role="alert">{errores.rol}</p>}
        
        <button type="submit">Crear cuenta</button>
      </form>
      <p>¿Ya tenés cuenta? <Link to="/login">Iniciar sesión</Link></p>
    </main>
  )
}

export default Registro
