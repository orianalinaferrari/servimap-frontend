import { apiRequest } from './apiClient'
export const crearSolicitud = (datos) => apiRequest('/api/solicitudes', { method: 'POST', json: datos })
