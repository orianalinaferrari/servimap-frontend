import { useContext, useEffect, useId, useRef, useState } from 'react'
import { AuthContext } from '../../context/authContextInstance'
import { normalizarRol, ROLES } from '../../utils/roles'
import { validarCambioContrasena } from '../../utils/cambioContrasena'

function FormularioContrasena({ guardar, onCerrar, onConfirmado, id }) {
  const formulario = useRef(null)
  const activo = useRef(true)
  const ocupado = useRef(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  useEffect(() => {
    activo.current = true
    const elemento = formulario.current
    elemento.elements.passwordActual.focus()
    return () => { activo.current = false; elemento.reset() }
  }, [])
  async function enviar(evento) {
    evento.preventDefault()
    if (ocupado.current) return
    const campos = new FormData(formulario.current)
    const datos = { passwordActual: campos.get('passwordActual'), passwordNueva: campos.get('passwordNueva') }
    try {
      validarCambioContrasena(datos)
      if (!campos.get('confirmacion')) throw new Error('Confirmá la contraseña nueva.')
      if (campos.get('confirmacion') !== datos.passwordNueva) throw new Error('La confirmación no coincide con la contraseña nueva.')
    } catch (fallo) { setError(fallo.message); return }
    ocupado.current = true
    setError(''); setEnviando(true)
    try {
      const confirmacion = await guardar(datos)
      if (!activo.current) return
      if (confirmacion?.mensaje !== 'Contraseña actualizada') throw new Error('El servidor no confirmó el cambio de contraseña.')
      formulario.current.reset()
      onConfirmado()
    } catch (fallo) { if (activo.current) setError(fallo.message) }
    finally { ocupado.current = false; if (activo.current) setEnviando(false) }
  }
  return <form ref={formulario} className="prestador-edicion prestador-edicion-en-sitio" aria-label="Cambiar contraseña" aria-busy={enviando} onSubmit={enviar} noValidate>
    <p id={`${id}-ayuda`}>La contraseña nueva debe tener al menos 8 caracteres y ser distinta de la actual. Los espacios se conservan.</p>
    {[["passwordActual", "Contraseña actual", "current-password"], ["passwordNueva", "Contraseña nueva", "new-password"], ["confirmacion", "Confirmar contraseña nueva", "new-password"]].map(([nombre, etiqueta, autocompletar]) => <div className="perfil-campo" key={nombre}>
      <label htmlFor={`${id}-${nombre}`}>{etiqueta}</label>
      <input id={`${id}-${nombre}`} name={nombre} type="password" required minLength={nombre === 'passwordActual' ? undefined : 8}
        autoComplete={autocompletar} spellCheck={false} autoCapitalize="none" aria-describedby={`${id}-ayuda`} disabled={enviando} />
    </div>)}
    {error && <p role="alert">{error}</p>}
    <div className="prestador-acciones"><button type="submit" disabled={enviando}>{enviando ? 'Guardando...' : 'Guardar contraseña'}</button><button type="button" disabled={enviando} onClick={onCerrar}>Cancelar</button></div>
  </form>
}

function SeccionContrasena({ guardar }) {
  const id = useId()
  const boton = useRef(null)
  const [editando, setEditando] = useState(false)
  const [confirmado, setConfirmado] = useState(false)
  function cerrar() { setEditando(false); requestAnimationFrame(() => boton.current?.focus()) }
  return <section className="prestador-tarjeta" aria-labelledby={`${id}-titulo`}>
    <h2 id={`${id}-titulo`}>Seguridad de la cuenta</h2>
    <p>El cambio de contraseña no cierra otras sesiones abiertas.</p>
    {confirmado && <p role="status">Contraseña actualizada.</p>}
    {editando ? <FormularioContrasena guardar={guardar} id={id} onCerrar={cerrar} onConfirmado={() => { setConfirmado(true); cerrar() }} />
      : <div className="prestador-acciones"><button ref={boton} type="button" onClick={() => { setConfirmado(false); setEditando(true) }}>Cambiar contraseña</button></div>}
  </section>
}

export default function CambioContrasena() {
  const auth = useContext(AuthContext)
  if (!auth?.usuario?.id || typeof auth.cambiarContrasena !== 'function' ||
      ![ROLES.CLIENTE, ROLES.PRESTADOR].includes(normalizarRol(auth.usuario.rol))) return null
  return <SeccionContrasena key={`${auth.claveSesion ?? 0}:${auth.usuario.id}:${auth.usuario.rol}`} guardar={auth.cambiarContrasena} />
}
