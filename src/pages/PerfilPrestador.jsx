import { useEffect, useState } from 'react'
import { VistaPerfilPrestador } from '../components/prestador/VistaPerfilPrestador'
import { obtenerMiPerfil, actualizarMiPerfil, obtenerMisCalificaciones } from '../services/prestadoresService'
import { FormularioPerfilPrestador } from '../components/prestador/FormularioPerfilPrestador'

export default function PerfilPrestador() {
  const [perfil, setPerfil] = useState(null)
  const [calificaciones, setCalificaciones] = useState([])
  const [editando, setEditando] = useState(false)
  const [error, setError] = useState('')
  const [errorComentarios, setErrorComentarios] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let activo = true
    obtenerMiPerfil().then((dato) => { if (activo) { setPerfil(dato); setError('') } }).catch((fallo) => { if (activo) setError(fallo.message) })
    obtenerMisCalificaciones().then((datos) => { if (activo) setCalificaciones(datos) }).catch((fallo) => { if (activo) setErrorComentarios(fallo.message) })
    return () => { activo = false }
  }, [revision])
  async function guardar(datos) {
    const actualizado = await actualizarMiPerfil(datos)
    setPerfil(actualizado); setEditando(false); setMensaje('Perfil actualizado en el servidor.')
  }
  return <main>
    {mensaje && <p role="status">{mensaje}</p>}
    {error && <div role="alert"><p>{error}</p><button onClick={() => setRevision((n) => n + 1)}>Reintentar perfil</button></div>}
    {!perfil && !error && <p role="status">Cargando perfil...</p>}
    {perfil && (editando ? <FormularioPerfilPrestador perfil={perfil} onGuardar={guardar} onCancelar={() => setEditando(false)} /> : <VistaPerfilPrestador perfil={perfil} onEditar={() => { setEditando(true); setMensaje('') }} />)}
    <section><h2>Calificaciones recibidas</h2>
      {errorComentarios && <p role="alert">{errorComentarios}</p>}
      {calificaciones.length === 0 && !errorComentarios && <p>Todavía no hay comentarios</p>}
      {calificaciones.map((calificacion) => <article key={calificacion.id}><p>{calificacion.puntaje} / 5</p><p>{calificacion.comentario}</p><p>{new Date(calificacion.fechaPublicacion).toLocaleDateString('es-AR')}</p></article>)}
    </section>
  </main>
}
