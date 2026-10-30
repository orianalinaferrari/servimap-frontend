import { useEffect, useState } from 'react'
import { listarOficios, obtenerMiPerfil, actualizarMisOficios } from '../services/prestadoresService'

export default function OficiosPrestador() {
  const [catalogo, setCatalogo] = useState([])
  const [oficios, setOficios] = useState([])
  const [seleccion, setSeleccion] = useState('')
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let activo = true
    async function cargar() {
      setCargando(true)
      try { const [lista, perfil] = await Promise.all([listarOficios(), obtenerMiPerfil()]); if (activo) { setCatalogo(lista); setOficios(perfil.oficios); setError('') } }
      catch (fallo) { if (activo) setError(fallo.message) }
      finally { if (activo) setCargando(false) }
    }
    cargar()
    return () => { activo = false }
  }, [revision])
  async function guardar() {
    if (enviando || cargando) return
    setEnviando(true); setError(''); setMensaje('')
    try { const perfil = await actualizarMisOficios(oficios.map((oficio) => oficio.id)); setOficios(perfil.oficios); setMensaje('Oficios guardados en el servidor.') }
    catch (fallo) { setError(fallo.message) } finally { setEnviando(false) }
  }
  return <main><h1>Mis oficios</h1><p>Administrá los oficios que ofrecés en ServiMap.</p>
    {cargando && <p role="status">Cargando oficios...</p>}
    {error && <div role="alert"><p>{error}</p><button onClick={() => setRevision((n) => n + 1)}>Reintentar oficios</button></div>}
    {mensaje && <p role="status">{mensaje}</p>}
    <h2>Oficios asociados</h2>
    {oficios.length === 0 && <p>No tenés oficios seleccionados.</p>}
    <ul>{oficios.map((oficio) => <li key={oficio.id}>{oficio.nombre} <button aria-label={`Quitar ${oficio.nombre}`} disabled={enviando || cargando} onClick={() => setOficios((lista) => lista.filter((item) => item.id !== oficio.id))}>Quitar</button></li>)}</ul>
    <label htmlFor="nuevo-oficio">Seleccionar oficio</label>
    <select id="nuevo-oficio" value={seleccion} onChange={(evento) => setSeleccion(evento.target.value)} disabled={cargando || enviando}>
      <option value="">Elegí un oficio</option>{catalogo.map((oficio) => <option value={oficio.id} key={oficio.id}>{oficio.nombre}</option>)}
    </select>
    <button disabled={cargando || enviando || !seleccion} onClick={() => { if (!oficios.some((oficio) => oficio.id === seleccion)) setOficios((lista) => [...lista, catalogo.find((oficio) => oficio.id === seleccion)]); setSeleccion(''); setMensaje('') }}>Agregar oficio</button>
    <button disabled={cargando || enviando || Boolean(error)} onClick={guardar}>{enviando ? 'Guardando...' : 'Guardar oficios'}</button>
  </main>
}
