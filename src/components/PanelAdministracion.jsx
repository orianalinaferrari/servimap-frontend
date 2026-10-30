import { useEffect, useState } from 'react'
import { ModeracionComentarios } from './ModeracionComentarios'
import { AdministracionOficios } from './AdministracionOficios'
import { IconoAdministracion } from './IconoAdministracion'
import '../styles/PanelAdministracion.css'
import { listarCalificaciones, moderarComentario } from '../services/calificacionesService'

export function PanelAdministracion({ prestadores = [], calificaciones, onModerar }) {
  const [seccionActiva, setSeccionActiva] = useState('comentarios')
  const [remotas, setRemotas] = useState([])
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(calificaciones === undefined)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    if (calificaciones !== undefined) return
    let activo = true
    listarCalificaciones().then((lista) => { if (activo) { setRemotas(lista); setError('') } }).catch((fallo) => { if (activo) setError(fallo.message) }).finally(() => { if (activo) setCargando(false) })
    return () => { activo = false }
  }, [calificaciones, revision])
  async function moderar(id, motivo) {
    if (onModerar) return onModerar(id, motivo)
    const actualizada = await moderarComentario(id, motivo)
    setRemotas((lista) => lista.map((calificacion) => calificacion.id === id ? actualizada : calificacion))
  }
  return <section className="panel panel-administracion"><h2>Panel de administración</h2>
    <nav className="panel-nav" aria-label="Secciones de administración">
      <button aria-pressed={seccionActiva === 'comentarios'} onClick={() => setSeccionActiva('comentarios')}><IconoAdministracion />Moderación de comentarios</button>
      <button aria-pressed={seccionActiva === 'oficios'} onClick={() => setSeccionActiva('oficios')}><IconoAdministracion tipo="configuracion" />Administración de oficios</button>
    </nav>
    {seccionActiva === 'comentarios' && <>
      {cargando && <p role="status">Cargando calificaciones...</p>}
      {error && <div role="alert"><p>{error}</p><button onClick={() => setRevision((n) => n + 1)}>Reintentar calificaciones</button></div>}
      {!cargando && !error && <ModeracionComentarios prestadores={prestadores} calificaciones={calificaciones ?? remotas} onModerar={moderar} />}
    </>}
    {seccionActiva === 'oficios' && <AdministracionOficios />}
  </section>
}
