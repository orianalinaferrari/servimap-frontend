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

export function moderarCalificacion(calificaciones, id, motivo, fecha) {
  return calificaciones.map((calificacion) =>
    calificacion.id === id
      ? {
          ...calificacion,
          moderada: true,
          motivoModeracion: motivo,
          fechaModeracion: fecha,
        }
      : calificacion
  )
}