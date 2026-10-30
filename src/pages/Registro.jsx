import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import CampoContrasena from '../components/CampoContrasena'
import { registrarUsuario } from '../services/authService'
import '../styles/Registro.css'

export default function Registro() {
  const [parametros] = useSearchParams()
  const rol = parametros.get('rol')
  const [formulario, setFormulario] = useState({ nombre: '', email: '', dni: '', contrasena: '', confirmarContrasena: '', rol: ['CLIENTE', 'PRESTADOR'].includes(rol) ? rol : '' })
  const [errores, setErrores] = useState({})
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [creado, setCreado] = useState(false)

  function cambiar({ target: { name, value } }) {
    setFormulario((anterior) => ({ ...anterior, [name]: value }))
    setErrores((anteriores) => ({ ...anteriores, [name]: '' }))
    setError('')
  }

  async function enviar(evento) {
    evento.preventDefault()
    if (enviando || creado) return
    const nuevos = {}
    const dni = formulario.dni.replace(/[.\s]/g, '')
    if (!formulario.nombre.trim()) nuevos.nombre = 'El nombre es obligatorio'
    if (!formulario.email.trim()) nuevos.email = 'El email es obligatorio'
    else if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(formulario.email.trim())) nuevos.email = 'Ingresá un email válido'
    if (!/^\d{7,8}$/.test(dni)) nuevos.dni = 'El DNI debe tener 7 u 8 números'
    if (!formulario.contrasena) nuevos.contrasena = 'La contraseña es obligatoria'
    else if (formulario.contrasena.length < 8) nuevos.contrasena = 'La contraseña debe tener al menos 8 caracteres'
    if (!formulario.confirmarContrasena) nuevos.confirmarContrasena = 'Confirmá tu contraseña'
    else if (formulario.contrasena !== formulario.confirmarContrasena) nuevos.confirmarContrasena = 'Las contraseñas no coinciden'
    if (!['CLIENTE', 'PRESTADOR'].includes(formulario.rol)) nuevos.rol = 'Seleccioná un tipo de usuario'
    setErrores(nuevos)
    if (Object.keys(nuevos).length) return
    setEnviando(true); setError('')
    try {
      await registrarUsuario({ nombre: formulario.nombre.trim(), dni, email: formulario.email.trim().toLowerCase(), password: formulario.contrasena, rol: formulario.rol })
      setCreado(true)
      setFormulario((anterior) => ({ ...anterior, contrasena: '', confirmarContrasena: '', dni: '' }))
    } catch (fallo) { setError(fallo.message) } finally { setEnviando(false) }
  }

  return (
    <main className="registro-pagina">
      <h1>Crear cuenta</h1>
      <p>Completá tus datos para registrarte en ServiMap.</p>
      {creado && <p role="status">Tu cuenta fue creada. Iniciá sesión para continuar.</p>}
      <form className="registro-formulario" onSubmit={enviar} noValidate aria-busy={enviando}>
        {[
          ['nombre', 'Nombre', 'text', 'name'], ['email', 'Email', 'email', 'email'], ['dni', 'DNI', 'text', 'off'],
          ['contrasena', 'Contraseña', 'password', 'new-password'], ['confirmarContrasena', 'Confirmar contraseña', 'password', 'new-password'],
        ].map(([name, label, type, autoComplete]) => {
          const Campo = type === 'password' ? CampoContrasena : 'input'
          return <div key={name}>
            <label htmlFor={name}>{label}</label>
            <Campo id={name} name={name} type={type} autoComplete={autoComplete} value={formulario[name]} onChange={cambiar} disabled={enviando || creado} aria-invalid={Boolean(errores[name])} aria-describedby={errores[name] ? `${name}-error` : undefined} placeholder={name === 'nombre' ? 'Nombre y apellido' : undefined} />
            {errores[name] && <p id={`${name}-error`} role="alert">{errores[name]}</p>}
          </div>
        })}
        <label htmlFor="rol">Tipo de usuario</label>
        <select id="rol" name="rol" value={formulario.rol} onChange={cambiar} disabled={enviando || creado} aria-invalid={Boolean(errores.rol)} aria-describedby={errores.rol ? 'rol-error' : undefined}>
          <option value="">Seleccionar</option><option value="CLIENTE">Cliente</option><option value="PRESTADOR">Prestador</option>
        </select>
        {errores.rol && <p id="rol-error" role="alert">{errores.rol}</p>}
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={enviando || creado}>{enviando ? 'Creando cuenta...' : 'Crear cuenta'}</button>
      </form>
      <p>¿Ya tenés cuenta? <Link to="/login">Iniciar sesión</Link></p>
    </main>
  )
}
