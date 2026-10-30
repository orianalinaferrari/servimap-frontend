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
  const esPrestador = formulario.rol === 'PRESTADOR'
  const nombreRol = formulario.rol === 'CLIENTE' ? 'Cliente' : esPrestador ? 'Prestador' : ''

  function iconoRol() {
    return <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {esPrestador ? <><rect x="4" y="9" width="20" height="15" rx="2" /><path d="M10 9V6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3M4 15a27 27 0 0 0 20 0M12 15h4v5h-4z" /></> : <><circle cx="11" cy="8" r="4" fill="currentColor" stroke="none" /><path d="M3 24v-3a8 8 0 0 1 16 0v3Z" fill="currentColor" stroke="none" /><circle cx="21" cy="10" r="3" fill="currentColor" stroke="none" /><path d="M21 16c4 0 5 4 5 8h-5" fill="currentColor" stroke="none" /></>}
    </svg>
  }

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
    <main className={`registro-pagina${esPrestador ? ' registro-prestador' : ''}`}>
      {nombreRol && <div className="registro-identidad">{iconoRol()}<span>{nombreRol}</span></div>}
      <h1>Crear cuenta</h1>
      <p className="registro-subtitulo">Completá tus datos para registrarte en ServiMap.</p>
      {creado && <p role="status">Tu cuenta fue creada. Iniciá sesión para continuar.</p>}
      <form className="registro-formulario" onSubmit={enviar} noValidate aria-busy={enviando}>
        {[
          ['nombre', 'Nombre y apellido', 'text', 'name'], ['email', 'Email', 'email', 'email'], ['dni', 'DNI', 'text', 'off'],
          ['contrasena', 'Contraseña', 'password', 'new-password'], ['confirmarContrasena', 'Confirmar contraseña', 'password', 'new-password'],
        ].map(([name, label, type, autoComplete]) => {
          const Campo = type === 'password' ? CampoContrasena : 'input'
          const placeholders = { nombre: 'Nombre y apellido', email: 'tu@email.com', dni: 'Ej: 12345678', contrasena: 'Mínimo 8 caracteres', confirmarContrasena: 'Repetí tu contraseña' }
          return <div className={`registro-campo registro-campo-${name}`} key={name}>
            <label htmlFor={name}>{label}</label>
            <Campo id={name} name={name} type={type} autoComplete={autoComplete} value={formulario[name]} onChange={cambiar} disabled={enviando || creado} aria-invalid={Boolean(errores[name])} aria-describedby={errores[name] ? `${name}-error` : undefined} placeholder={placeholders[name]} inputMode={name === 'dni' ? 'numeric' : undefined} />
            {errores[name] && <p id={`${name}-error`} role="alert">{errores[name]}</p>}
          </div>
        })}
        <div className="registro-campo registro-campo-rol">
          <label htmlFor="rol">Tipo de usuario</label>
          <div className="registro-selector">{nombreRol && iconoRol()}
            <select id="rol" name="rol" value={formulario.rol} onChange={cambiar} disabled={enviando || creado} aria-invalid={Boolean(errores.rol)} aria-describedby={errores.rol ? 'rol-error' : undefined}>
          <option value="">Seleccionar</option><option value="CLIENTE">Cliente</option><option value="PRESTADOR">Prestador</option>
            </select>
          </div>
          {errores.rol && <p id="rol-error" role="alert">{errores.rol}</p>}
        </div>
        {error && <p className="registro-error-servidor" role="alert">{error}</p>}
        <button type="submit" disabled={enviando || creado}>{enviando ? 'Creando cuenta...' : nombreRol ? `Crear cuenta como ${nombreRol.toLowerCase()}` : 'Crear cuenta'}</button>
      </form>
      <p className="registro-login">¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link></p>
    </main>
  )
}
