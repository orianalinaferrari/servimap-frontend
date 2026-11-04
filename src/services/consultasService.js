// El backend todavía no ofrece consultas. No hay rutas HTTP ni persistencia local.
// El futuro adaptador debe implementar este puerto después de aprobar Swagger.
export const consultasNoDisponibles = Object.freeze({ disponible: false })

export function servicioConsultasDisponible(servicio) {
  return servicio?.disponible === true &&
    ['crear', 'listar', 'obtener', 'responder', 'cerrar'].every(operacion => typeof servicio[operacion] === 'function')
}
