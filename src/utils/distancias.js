import { obtenerCoordenadas } from './coordenadasPrestadores'

function coordenadasValidas(punto) {
  const valores = [punto?.latitud ?? punto?.lat, punto?.longitud ?? punto?.lng]
  if (!valores.every(valor => typeof valor === 'number' || (typeof valor === 'string' && valor.trim() !== ''))) return null
  return obtenerCoordenadas(punto)
}

export function calcularDistanciaKm(origen, destino) {
  const desde = coordenadasValidas(origen)
  const hasta = coordenadasValidas(destino)
  if (!desde || !hasta) return null
  const radianes = grados => grados * Math.PI / 180
  const [lat1, lng1] = desde.map(radianes)
  const [lat2, lng2] = hasta.map(radianes)
  const a = Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2
  // Limitar el error de redondeo en puntos coincidentes o antípodas.
  return 2 * 6371 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))))
}

export function textoDistancia(referencia, prestador) {
  if (!coordenadasValidas(referencia)) return null
  const distancia = calcularDistanciaKm(referencia, prestador)
  if (distancia === null) return 'Distancia no disponible'
  const kilometros = distancia.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return `Distancia aproximada: ${kilometros} km en línea recta (no por calles)`
}
