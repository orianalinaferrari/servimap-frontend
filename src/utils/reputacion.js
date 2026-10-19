export function obtenerCalificacionesVisibles(calificaciones, prestadorId) {
  return calificaciones.filter(
    (calificacion) =>
      calificacion.prestadorId === prestadorId && !calificacion.moderada
  )
}

export function generarEstrellas(promedio) {
  const llenas = Math.round(promedio)
  return '★'.repeat(llenas) + '☆'.repeat(5 - llenas)
}