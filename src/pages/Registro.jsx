import { useState } from 'react'
import '../styles/Registro.css'

function Registro() {
  const [formulario, setFormulario] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    contrasena: '',
    confirmarContrasena: '',
    rol: '',
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
          type="text"
          value={formulario.nombre}
          onChange={manejarCambio}
        />
        {errores.nombre && <p role="alert">{errores.nombre}</p>}

        <label htmlFor="apellido">Apellido</label>
        <input
          id="apellido"
          name="apellido"
          type="text"
          value={formulario.apellido}
          onChange={manejarCambio}
        />
        {errores.apellido && <p role="alert">{errores.apellido}</p>}

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formulario.email}
          onChange={manejarCambio}
        />
        {errores.email && <p role="alert">{errores.email}</p>}

        <label htmlFor="telefono">Teléfono</label>
        <input
          id="telefono"
          name="telefono"
          type="tel"
          value={formulario.telefono}
          onChange={manejarCambio}
        />
        {errores.telefono && <p role="alert">{errores.telefono}</p>}

        <label htmlFor="contrasena">Contraseña</label>
        <input
          id="contrasena"
          name="contrasena"
          type="password"
          value={formulario.contrasena}
          onChange={manejarCambio}
        />
        {errores.contrasena && <p role="alert">{errores.contrasena}</p>}

        <label htmlFor="confirmarContrasena">Confirmar contraseña</label>
        <input
          id="confirmarContrasena"
          name="confirmarContrasena"
          type="password"
          value={formulario.confirmarContrasena}
          onChange={manejarCambio}
        />
        {errores.confirmarContrasena && <p role="alert">{errores.confirmarContrasena}</p>}

        <label htmlFor="rol">Tipo de usuario</label>
        <select
          id="rol"
          name="rol"
          value={formulario.rol}
          onChange={manejarCambio}
        >

          <option value="">Seleccionar</option>
          <option value="CLIENTE">Cliente</option>
          <option value="PRESTADOR">Prestador</option>
        </select>
        
        {errores.rol && <p role="alert">{errores.rol}</p>}
        
        <button type="submit">Crear cuenta</button>
      </form>
    </main>
  )
}

export default Registro
