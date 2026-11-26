import { useContext, useEffect, useState } from 'react'
import { VistaPerfilPrestador } from '../components/prestador/VistaPerfilPrestador'
import { obtenerMiPerfil, actualizarMiPerfil, obtenerMisCalificaciones } from '../services/prestadoresService'
import { FormularioPerfilPrestador } from '../components/prestador/FormularioPerfilPrestador'
import { IconoPrestador } from '../components/prestador/IconoPrestador'
import { AuthContext } from '../context/authContextInstance'
import EdicionNombreUsuario from '../components/perfil/EdicionNombreUsuario'

export default function PerfilPrestador() {
  const auth = useContext(AuthContext)
  const [perfil, setPerfil] = useState(null)
  const [calificaciones, setCalificaciones] = useState([])
  const [editando, setEditando] = useState(false)
  const [sesionEditandoNombre, setSesionEditandoNombre] = useState(null)
  const identidadCuenta = `${auth?.claveSesion ?? 0}:${auth?.usuario?.id ?? ''}:${auth?.usuario?.rol ?? ''}`
  const editandoNombre = sesionEditandoNombre === identidadCuenta
  const [error, setError] = useState('')
  const [errorComentarios, setErrorComentarios] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [revision, setRevision] = useState(0)
  // Un GET profesional iniciado antes del PATCH no debe restituir el nombre anterior.
  const perfilVisible = perfil && auth?.usuario?.nombre ? { ...perfil, nombre: auth.usuario.nombre } : perfil
  useEffect(() => {
    let activo = true
    obtenerMiPerfil().then((dato) => { if (activo) { setPerfil(dato); setError('') } }).catch((fallo) => { if (activo) setError(fallo.message) })
    obtenerMisCalificaciones().then((datos) => { if (activo) setCalificaciones(datos) }).catch((fallo) => { if (activo) setErrorComentarios(fallo.message) })
    return () => { activo = false }
  }, [revision])
  async function guardar(datos) {
    const actualizado = await actualizarMiPerfil(datos)
    if (actualizado?.id !== perfil.id || !Array.isArray(actualizado.oficios)) throw new Error('El servidor no confirmó un perfil válido. Se conserva tu edición sin guardar.')
    setPerfil(actualizado); setEditando(false); setMensaje('Perfil actualizado en el servidor.')
  }
  return <main className="prestador-pagina prestador-perfil">
    {mensaje && <p role="status">{mensaje}</p>}
    {error && <div role="alert"><p>{error}</p><button onClick={() => setRevision((n) => n + 1)}>Reintentar perfil</button></div>}
    {!perfil && !error && <p role="status">Cargando perfil...</p>}
    {perfilVisible && (editando ? <FormularioPerfilPrestador perfil={perfilVisible} enSitio onGuardar={guardar} onCancelar={() => setEditando(false)} /> : <VistaPerfilPrestador perfil={perfilVisible} onEditar={editandoNombre ? undefined : () => { setEditando(true); setMensaje('') }} />)}
    {perfilVisible && <EdicionNombreUsuario deshabilitado={editando} onCambiarEdicion={valor => setSesionEditandoNombre(valor ? identidadCuenta : null)} />}
    <section className="prestador-tarjeta prestador-calificaciones"><h2><IconoPrestador tipo="estrella" />Calificaciones recibidas</h2>
      {errorComentarios && <p role="alert">{errorComentarios}</p>}
      {calificaciones.length === 0 && !errorComentarios && <p>Todavía no hay comentarios</p>}
      <div className="prestador-resenas">{calificaciones.map((calificacion) => <article key={calificacion.id}><div className="prestador-resena-cabecera"><span className="prestador-estrellas" aria-hidden="true">{[1,2,3,4,5].map((valor) => <IconoPrestador key={valor} tipo="estrella" className={valor <= calificacion.puntaje ? '' : 'sin-puntaje'} />)}</span><time dateTime={calificacion.fechaPublicacion}>{new Date(calificacion.fechaPublicacion).toLocaleDateString('es-AR')}</time></div><p><strong>{calificacion.puntaje} / 5</strong></p><p>{calificacion.comentario}</p></article>)}</div>
    </section>
  </main>
}
