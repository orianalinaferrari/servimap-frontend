import { useEffect, useRef, useState } from 'react'
import { FotoPrestador } from './FotoPrestador'
import { obtenerIniciales } from '../../utils/perfilUsuario'
import { IconoPrestador } from './IconoPrestador'

// Límite local para la vista previa; la API actual no admite subir archivos.
const MAX_BYTES = 5 * 1024 * 1024
export function SelectorFotoPrestador({ perfil, archivo, onSeleccionar, disabled }) {
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const entrada = useRef(null)
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview) }
  }, [preview])
  function seleccionar(evento) {
    const foto = evento.target.files?.[0]
    setError('')
    if (!foto) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(foto.type) || !/\.(jpe?g|png|webp)$/i.test(foto.name)) {
      setError('Elegí una imagen JPG, JPEG, PNG o WebP.'); evento.target.value = ''; return
    }
    if (foto.size > MAX_BYTES) { setError('La imagen no puede superar los 5 MB.'); evento.target.value = ''; return }
    try { setPreview(URL.createObjectURL(foto)); onSeleccionar(foto) }
    catch { setError('No se pudo abrir la imagen seleccionada.'); evento.target.value = '' }
  }
  const respaldo = obtenerIniciales(perfil.nombre) || <IconoPrestador tipo="usuario" />
  return <div>
    <label htmlFor="foto-local">Foto de perfil</label>
    <input ref={entrada} id="foto-local" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" disabled={disabled} onChange={seleccionar} aria-describedby="foto-ayuda" />
    <p id="foto-ayuda">JPG, JPEG, PNG o WebP, hasta 5 MB para vista previa. La carga de fotos todavía no está disponible: la imagen seleccionada no se guardará.</p>
    <span className="prestador-avatar" aria-hidden="true">{archivo && preview
      ? <img className="foto-prestador" src={preview} alt="" onError={() => { setPreview(''); setError('No se pudo abrir la imagen seleccionada. Elegí otra foto.') }} />
      : <FotoPrestador key={`${perfil.id}:${perfil.fotoPerfil}`} prestador={perfil} respaldo={respaldo} />}</span>
    {archivo && <><p role="status">Vista previa sin guardar. Quitá la selección para guardar los demás datos del perfil.</p><button type="button" disabled={disabled} onClick={() => { onSeleccionar(null); setPreview(''); setError(''); entrada.current.value = '' }}>Quitar selección de foto</button></>}
    {error && <p role="alert">{error}</p>}
  </div>
}
