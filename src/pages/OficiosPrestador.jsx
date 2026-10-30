import { useEffect, useState } from 'react'
import { listarOficios, obtenerMiPerfil, actualizarMisOficios } from '../services/prestadoresService'
import { IconoPrestador } from '../components/prestador/IconoPrestador'

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
    void cargar()
    return () => { activo = false }
  }, [revision])
  const disponibles = catalogo.filter((item) => !oficios.some((oficio) => oficio.id === item.id))
  async function guardar() {
    if (enviando || cargando) return
    setEnviando(true); setError(''); setMensaje('')
    try { const perfil = await actualizarMisOficios(oficios.map((oficio) => oficio.id)); setOficios(perfil.oficios); setMensaje('Oficios guardados en el servidor.') }
    catch (fallo) { setError(fallo.message) } finally { setEnviando(false) }
  }
  return <main className="prestador-pagina prestador-oficios"><header className="prestador-titulo"><div><h1>Mis oficios</h1><p>Administrá los oficios que ofrecés en ServiMap.</p></div></header>
    {cargando && <p role="status">Cargando oficios...</p>}
    {error && <div role="alert"><p>{error}</p><button onClick={() => setRevision((n) => n + 1)}>Reintentar oficios</button></div>}
    {mensaje && <p role="status">{mensaje}</p>}
    <section className="prestador-bloque-suave"><header className="prestador-seccion-titulo"><span className="prestador-circulo"><IconoPrestador /></span><div><h2>Oficios asociados</h2><p>Estos son los oficios que tenés habilitados en tu perfil.</p></div></header>
    {oficios.length === 0 && <p>No tenés oficios seleccionados.</p>}
    <ul className="prestador-oficios-lista">{oficios.map((oficio) => <li key={oficio.id}><span className={`prestador-oficio-icono ${/electri/i.test(oficio.nombre) ? 'electrico' : ''}`}><IconoPrestador tipo={/electri/i.test(oficio.nombre) ? 'electricidad' : 'herramienta'} /></span><span>{oficio.nombre}</span><button aria-label={`Quitar ${oficio.nombre}`} disabled={enviando || cargando} onClick={() => setOficios((lista) => lista.filter((item) => item.id !== oficio.id))}><IconoPrestador tipo="quitar" />Quitar</button></li>)}</ul>
    </section><section className="prestador-bloque-suave"><header className="prestador-seccion-titulo"><span className="prestador-circulo"><IconoPrestador tipo="agregar" /></span><div><h2>Agregar un nuevo oficio</h2><p>Seleccioná un oficio de la lista para agregarlo a tu perfil.</p></div></header>
    <label htmlFor="nuevo-oficio">Seleccionar oficio</label>
    <select id="nuevo-oficio" value={seleccion} onChange={(evento) => setSeleccion(evento.target.value)} disabled={cargando || enviando}>
      <option value="">Elegí un oficio</option>{disponibles.map((oficio) => <option value={oficio.id} key={oficio.id}>{oficio.nombre}</option>)}
    </select>
    <div className="prestador-acciones"><button disabled={cargando || enviando || !seleccion} onClick={() => { if (!oficios.some((oficio) => oficio.id === seleccion)) setOficios((lista) => [...lista, catalogo.find((oficio) => oficio.id === seleccion)]); setSeleccion(''); setMensaje('') }}>Agregar oficio</button>
    <button disabled={cargando || enviando || Boolean(error)} onClick={guardar}>{enviando ? 'Guardando...' : 'Guardar oficios'}</button>
    </div></section></main>
}
