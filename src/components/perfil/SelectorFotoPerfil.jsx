import { useEffect, useId, useRef, useState } from 'react'
import { FotoPrestador } from '../prestador/FotoPrestador'
import { obtenerIniciales } from '../../utils/perfilUsuario'

// Preparado para un futuro contrato de subida. No se monta en las rutas productivas.
// Solo entrega File al consumidor; nunca persiste blob:, rutas locales o base64.
export function SelectorFotoPerfil({ nombre, fotoActual, onSeleccionar, onEliminar }) {
  const id = useId()
  const input = useRef(null)
  const [seleccion, setSeleccion] = useState(null)
  const [error, setError] = useState('')
  const [eliminando, setEliminando] = useState(false)
  useEffect(() => () => { if (seleccion) URL.revokeObjectURL(seleccion.url) }, [seleccion])

  function cancelar() {
    setSeleccion(null)
    setError('')
    input.current.value = ''
    onSeleccionar(null)
  }
  function elegir(evento) {
    const archivo = evento.target.files?.[0]
    if (!archivo) return
    let mensaje = ''
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(archivo.type)) mensaje = 'Elegí una imagen JPEG, PNG, WebP o GIF.'
    else if (archivo.size === 0 || archivo.size > 5 * 1024 * 1024) mensaje = 'La imagen debe pesar entre 1 byte y 5 MB.'
    setSeleccion(null)
    onSeleccionar(null)
    if (mensaje) { setError(mensaje); evento.target.value = ''; return }
    try { setSeleccion({ archivo, url: URL.createObjectURL(archivo) }); setError('') }
    catch { evento.target.value = ''; setError('No se pudo preparar la vista previa. Intentá con otra imagen.') }
  }
  async function eliminar() {
    if (eliminando) return
    setEliminando(true); setError('')
    try { await onEliminar(); cancelar() }
    catch { setError('No se pudo eliminar la foto. Se conserva la imagen anterior.') }
    finally { setEliminando(false) }
  }
  return <section className="selector-foto" aria-label="Seleccionar foto de perfil" aria-busy={eliminando}>
    <span className="prestador-avatar">
      {seleccion ? <img className="foto-prestador" src={seleccion.url} alt="Vista previa de foto" onLoad={() => onSeleccionar(seleccion.archivo)} onError={() => { setSeleccion(null); input.current.value = ''; onSeleccionar(null); setError('No se pudo leer la imagen. Elegí otro archivo.') }} /> : <FotoPrestador key={fotoActual} prestador={{ fotoPerfil: fotoActual }} respaldo={obtenerIniciales(nombre) || 'Sin foto'} />}
    </span>
    <label htmlFor={id}>Cambiar foto</label>
    <input ref={input} id={id} type="file" accept="image/*" disabled={eliminando} onChange={elegir} aria-describedby={`${id}-ayuda`} />
    <p id={`${id}-ayuda`}>JPEG, PNG, WebP o GIF, hasta 5 MB. La selección solo prepara una vista previa; todavía no se guardó.</p>
    {seleccion && <button type="button" onClick={cancelar} disabled={eliminando}>Cancelar selección</button>}
    {fotoActual && onEliminar && <button type="button" onClick={eliminar} disabled={eliminando}>{eliminando ? 'Eliminando...' : 'Eliminar foto'}</button>}
    {error && <p role="alert">{error}</p>}
  </section>
}
