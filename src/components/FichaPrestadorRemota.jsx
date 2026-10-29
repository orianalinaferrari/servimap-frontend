import { useEffect, useState } from 'react'
import { obtenerPrestador } from '../services/prestadoresService'
import { DetallePrestador } from './DetallePrestador'

export default function FichaPrestadorRemota({ id, onVolver }) {
  const [prestador, setPrestador] = useState(null)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let activo = true
    obtenerPrestador(id).then((dato) => { if (activo) { setPrestador(dato); setError('') } }).catch((fallo) => { if (activo) setError(fallo.message) })
    return () => { activo = false }
  }, [id, revision])
  if (error) return <section><p role="alert">{error}</p><button onClick={() => setRevision((n) => n + 1)}>Reintentar ficha</button><button onClick={onVolver}>Volver</button></section>
  if (!prestador) return <section><p role="status">Cargando ficha...</p><button onClick={onVolver}>Volver</button></section>
  return <DetallePrestador prestador={prestador} calificaciones={prestador.comentarios} onVolver={onVolver} />
}
