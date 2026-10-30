import { listarSolicitudes, transicionarSolicitud } from './solicitudesApi'
export const obtenerSolicitudesPrestador = listarSolicitudes
export const aceptarSolicitudPrestador = (id) => transicionarSolicitud(id, 'aceptar')
export const rechazarSolicitudPrestador = (id) => transicionarSolicitud(id, 'rechazar')
export const marcarTrabajoTerminadoPrestador = (id) => transicionarSolicitud(id, 'finalizar')
