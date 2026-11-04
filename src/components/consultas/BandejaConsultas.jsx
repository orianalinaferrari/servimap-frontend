import { useEffect, useRef, useState } from 'react'
import { consultaPermitida, errorConsulta, LIMITE_CONSULTAS, paginaConsultasValida } from '../../utils/consultasAyuda'
import FormularioConsulta from './FormularioConsulta'
import ListaConsultas from './ListaConsultas'
import DetalleConsulta from './DetalleConsulta'

// Solo recibe un adaptador explícito y una sesión ya autorizada por CentroConsultas.
export default function BandejaConsultas({ servicio, usuario, administracion }) {
  const [pagina, setPagina] = useState(1)
  const [estado, setEstado] = useState('')
  const [revision, setRevision] = useState(0)
  const [resultado, setResultado] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const activo = useRef(true)
  useEffect(() => { activo.current = true; return () => { activo.current = false } }, [])
  useEffect(() => {
    let vigente = true
    async function cargar() {
      setCargando(true); setError(''); setResultado(null)
      try {
        const datos = await servicio.listar({ pagina, limite: LIMITE_CONSULTAS, estado })
        if (!vigente) return
        if (!paginaConsultasValida(datos, pagina, estado, usuario, administracion)) throw new Error('Respuesta no confirmada')
        setResultado(datos)
      } catch (fallo) { if (vigente) setError(errorConsulta(fallo)) }
      finally { if (vigente) setCargando(false) }
    }
    void cargar()
    return () => { vigente = false }
  }, [servicio, usuario, administracion, pagina, estado, revision])

  function confirmarConsulta(datos) {
    if (!activo.current || !consultaPermitida(datos, usuario, administracion)) throw new Error('Respuesta no confirmada')
    return datos
  }
  async function crear(datos) {
    const nueva = confirmarConsulta(await servicio.crear(datos))
    if (nueva.estado !== 'PENDIENTE' || ['asunto', 'categoria', 'mensaje'].some(campo => nueva[campo] !== datos[campo])) throw new Error('Creación no confirmada')
    setPagina(1); setEstado(''); setDetalle(null); setRevision(valor => valor + 1)
    setMensaje('La consulta fue registrada por el servidor.')
  }
  async function abrir(id) {
    if (ocupado) return
    setOcupado(true); setError(''); setMensaje('')
    try {
      const consulta = confirmarConsulta(await servicio.obtener(id))
      if (consulta.id !== id) throw new Error('Detalle no confirmado')
      setDetalle(consulta)
    } catch (fallo) { if (activo.current) setError(errorConsulta(fallo)) }
    finally { if (activo.current) setOcupado(false) }
  }
  async function actualizar(accion, respuesta) {
    if (!administracion || ocupado || !detalle || detalle.estado === 'CERRADA' || (accion === 'responder' && detalle.estado !== 'PENDIENTE')) throw new Error('Acción no permitida')
    setOcupado(true); setMensaje('')
    try {
      const datos = accion === 'responder' ? await servicio.responder(detalle.id, respuesta) : await servicio.cerrar(detalle.id)
      const confirmada = confirmarConsulta(datos)
      if (confirmada.id !== detalle.id || confirmada.autorId !== detalle.autorId || confirmada.estado !== (accion === 'responder' ? 'RESPONDIDA' : 'CERRADA') || (accion === 'responder' && confirmada.respuesta.mensaje !== respuesta)) throw new Error('Cambio no confirmado')
      setDetalle(confirmada); setRevision(valor => valor + 1)
      setMensaje(accion === 'responder' ? 'La respuesta fue guardada por el servidor.' : 'El cierre fue confirmado por el servidor.')
    } finally { if (activo.current) setOcupado(false) }
  }
  return <div className="consultas-contenido">
    {mensaje && <p role="status">{mensaje}</p>}
    {cargando && <p role="status">Cargando consultas...</p>}
    {error && <div role="alert"><p>{error}</p><button type="button" disabled={ocupado || cargando} onClick={() => setRevision(valor => valor + 1)}>Reintentar consultas</button></div>}
    {detalle ? <DetalleConsulta key={`${detalle.id}:${detalle.estado}`} consulta={detalle} administracion={administracion} ocupado={ocupado} onResponder={texto => actualizar('responder', texto)} onCerrar={() => actualizar('cerrar')} onVolver={() => setDetalle(null)} /> : <>
      {!administracion && <FormularioConsulta habilitado={!ocupado && !cargando} onEnviar={crear} />}
      {resultado && <ListaConsultas resultado={resultado} estado={estado} onEstado={valor => { setEstado(valor); setPagina(1) }} onPagina={setPagina} onAbrir={abrir} ocupado={ocupado || cargando} />}
    </>}
  </div>
}
