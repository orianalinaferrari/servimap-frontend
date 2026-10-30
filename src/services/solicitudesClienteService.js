import { listarSolicitudes, transicionarSolicitud } from './solicitudesApi'
export const obtenerSolicitudesCliente = listarSolicitudes
export const cancelarSolicitudCliente = (id) => transicionarSolicitud(id, 'cancelar')
