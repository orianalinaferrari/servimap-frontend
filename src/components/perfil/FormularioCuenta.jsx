import { useEffect, useRef, useState } from 'react'
import { normalizarNombreUsuario } from '../../utils/nombreUsuario'

// onGuardar debe devolver el usuario persistido y verificado por el consumidor.
export function FormularioCuenta({ usuario, onGuardar, onCancelar, onConfirmado }) {
  const [nombre, setNombre] = useState(usuario.nombre ?? '')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const activo = useRef(true)
  const ocupado = useRef(false)
  useEffect(() => { activo.current = true; return () => { activo.current = false } }, [])
  async function enviar(evento) {
    evento.preventDefault()
    if (ocupado.current) return
    let limpio
    try { limpio = normalizarNombreUsuario(nombre) }
    catch (fallo) { setError(fallo.message); return }
    ocupado.current = true
    setError(''); setEnviando(true)
    try {
      const confirmado = await onGuardar({ nombre: limpio })
      if (!activo.current) return
      if (confirmado?.id !== usuario.id || confirmado?.nombre !== limpio) throw new Error('El servidor no confirmó el nombre. Se conserva tu edición sin guardar.')
      await onConfirmado(confirmado)
    } catch (fallo) { if (activo.current) setError(fallo.message) }
    finally { ocupado.current = false; if (activo.current) setEnviando(false) }
  }
  return <form className="prestador-edicion prestador-edicion-en-sitio" onSubmit={enviar} aria-label="Editar datos de cuenta" aria-busy={enviando}>
    <section className="prestador-tarjeta"><h2>Datos personales</h2>
      <div className="perfil-campo"><label htmlFor="cuenta-nombre">Nombre y apellido</label><input id="cuenta-nombre" value={nombre} maxLength={100} onChange={(e) => setNombre(e.target.value)} disabled={enviando} autoComplete="name" /></div>
      <dl><dt>Email</dt><dd>{usuario.email}</dd><dt>DNI</dt><dd>{usuario.dni}</dd></dl>
      {error && <p role="alert">{error}</p>}
    </section>
    <div className="prestador-acciones"><button type="submit" disabled={enviando}>{enviando ? 'Guardando...' : 'Guardar cambios'}</button><button type="button" onClick={onCancelar} disabled={enviando}>Cancelar</button></div>
  </form>
}
