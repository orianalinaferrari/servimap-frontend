export function obtenerCoordenadas(prestador) {
  const lat = prestador?.latitud ?? prestador?.lat
  const lng = prestador?.longitud ?? prestador?.lng

  if (lat === null || lat === undefined || lat === '' ||
      lng === null || lng === undefined || lng === '') {
    return null
  }

  const latitud = Number(lat)
  const longitud = Number(lng)

  if (!Number.isFinite(latitud) || !Number.isFinite(longitud) ||
      latitud < -90 || latitud > 90 ||
      longitud < -180 || longitud > 180) {
    return null
  }

  return [latitud, longitud]
}

export function prestadoresConUbicacion(prestadores = []) {
  return prestadores.filter((prestador) => obtenerCoordenadas(prestador))
}
