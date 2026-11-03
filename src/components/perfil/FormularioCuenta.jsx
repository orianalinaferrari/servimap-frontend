import { useState } from 'react'

// Sin ruta ni servicio HTTP hasta que backend autorice editar la cuenta.
// onGuardar debe devolver el usuario persistido y verificado por el consumidor.
export function FormularioCuenta({ usuario, onGuardar, onCancelar, onConfirmado }) {
  const [nombre, setNombre] = useState(usuario.nombre ?? '')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  async function enviar(evento) {
    evento.preventDefault()
    if (enviando) return
    if (!nombre.trim()) { setError('El nombre es obligatorio.'); return }
    setError(''); setEnviando(true)
    try {
      const confirmado = await onGuardar({ nombre: nombre.trim() })
      if (confirmado?.id !== usuario.id || confirmado?.nombre !== nombre.trim()) throw new Error('El servidor no confirmó el nombre. Se conserva tu edición sin guardar.')
      await onConfirmado(confirmado)
    } catch (fallo) { setError(fallo.message) }
    finally { setEnviando(false) }
  }
  return <form className="prestador-edicion prestador-edicion-en-sitio" onSubmit={enviar} aria-label="Editar datos de cuenta" aria-busy={enviando}>
    <section className="prestador-tarjeta"><h2>Datos personales</h2>
      <div className="perfil-campo"><label htmlFor="cuenta-nombre">Nombre y apellido</label><input id="cuenta-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} disabled={enviando} autoComplete="name" /></div>
      <dl><dt>Email</dt><dd>{usuario.email}</dd><dt>DNI</dt><dd>{usuario.dni}</dd></dl>
      {error && <p role="alert">{error}</p>}
    </section>
    <div className="prestador-acciones"><button type="submit" disabled={enviando}>{enviando ? 'Guardando...' : 'Guardar cambios'}</button><button type="button" onClick={onCancelar} disabled={enviando}>Cancelar</button></div>
  </form>
}
