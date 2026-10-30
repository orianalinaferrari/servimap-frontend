import { useCallback, useEffect, useState } from 'react'
import { listarPrestadores, listarOficios, listarMarcadores } from '../services/prestadoresService'
import { BuscadorPrestadores } from './BuscadorPrestadores'

export default function DirectorioPrestadores() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')
  const [errorMapa, setErrorMapa] = useState('')
  const [cargando, setCargando] = useState(true)
  const [revision, setRevision] = useState(0)
  const reintentar = useCallback(() => setRevision((valor) => valor + 1), [])
  useEffect(() => {
    let activo = true
    async function cargar() {
      setCargando(true); setError(''); setErrorMapa('')
      const [directorio, mapa] = await Promise.allSettled([
        Promise.all([listarPrestadores(), listarOficios()]), listarMarcadores(),
      ])
      if (!activo) return
      if (directorio.status === 'fulfilled') {
        setDatos({ prestadores: directorio.value[0], oficios: directorio.value[1], marcadores: mapa.status === 'fulfilled' ? mapa.value : [] })
      } else { setDatos(null); setError(directorio.reason.message) }
      if (mapa.status === 'rejected') setErrorMapa(mapa.reason.message)
      setCargando(false)
    }
    cargar()
    return () => { activo = false }
  }, [revision])
  return <>
    {cargando && <p role="status">Cargando prestadores...</p>}
    {error && <div role="alert"><p>{error}</p><button onClick={reintentar}>Reintentar búsqueda</button></div>}
    {errorMapa && <div role="alert"><p>No se pudieron cargar las ubicaciones públicas: {errorMapa}</p><button onClick={reintentar}>Reintentar ubicaciones</button></div>}
    {!cargando && datos && <BuscadorPrestadores prestadores={datos.prestadores} catalogoOficios={datos.oficios} marcadoresPublicos={datos.marcadores} />}
    {!cargando && datos && <p>Se muestran hasta 50 prestadores. El mapa usa únicamente ubicaciones públicas aproximadas.</p>}
  </>
}
