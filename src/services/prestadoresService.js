import { apiRequest } from './apiClient'

export const listarOficios = () => apiRequest('/api/oficios', { autenticar: false })
export const listarTodosLosOficios = () => apiRequest('/api/oficios/todos')
export const crearOficioRemoto = (datos) => apiRequest('/api/oficios', { method: 'POST', json: datos })
export const actualizarOficio = (id, datos) => apiRequest(`/api/oficios/${encodeURIComponent(id)}`, { method: 'PUT', json: datos })
export const cambiarEstadoOficioRemoto = (id, activo) => apiRequest(`/api/oficios/${encodeURIComponent(id)}/estado`, { method: 'PATCH', json: { activo } })

export function adaptarPrestador(datos) {
  const oficiosCatalogo = datos.oficios || []
  return {
    ...datos,
    oficiosCatalogo,
    oficios: oficiosCatalogo.map((oficio) => oficio.nombre),
    calificacionPromedio: datos.reputacion?.promedio ?? null,
    trabajosFinalizados: datos.reputacion?.serviciosFinalizados ?? 0,
    comentarios: (datos.comentarios || []).map((comentario) => ({ ...comentario, prestadorId: datos.id })),
  }
}

export const listarPrestadores = async (parametros = {}) => (await apiRequest('/api/prestadores', { autenticar: false, parametros: { limit: 50, ...parametros } })).map(adaptarPrestador)
export const obtenerPrestador = async (id) => adaptarPrestador(await apiRequest(`/api/prestadores/${encodeURIComponent(id)}`, { autenticar: false }))
export const listarMarcadores = async (parametros = {}) => (await apiRequest('/api/prestadores/mapa', { autenticar: false, parametros })).map((dato) => ({ ...dato, oficios: dato.oficioPrincipal ? [dato.oficioPrincipal] : [] }))
export const obtenerMiPerfil = () => apiRequest('/api/prestadores/me', { cache: 'no-store' })
export const actualizarMiPerfil = (datos) => apiRequest('/api/prestadores/me', { method: 'PUT', json: datos })
export async function actualizarMisOficios(oficioIds) {
  const ids = new Set(oficioIds)
  const coincide = (perfil) => Array.isArray(perfil?.oficios) &&
    perfil.oficios.length === ids.size && perfil.oficios.every((oficio) =>
      oficio && typeof oficio.nombre === 'string' && ids.has(oficio.id)) &&
    new Set(perfil.oficios.map((oficio) => oficio.id)).size === ids.size
  const actualizado = await apiRequest('/api/prestadores/me/oficios', { method: 'PUT', json: { oficioIds } })
  if (!actualizado?.id || !coincide(actualizado)) throw new Error('El servidor no confirmó los oficios enviados. Se conserva tu selección sin confirmar.')
  const verificado = await obtenerMiPerfil()
  if (verificado?.id !== actualizado.id || !coincide(verificado)) throw new Error('El servidor respondió al guardado, pero al consultar el perfil los oficios no coinciden. No se pudo confirmar la persistencia; se conserva tu selección.')
  return verificado
}
export const obtenerMisCalificaciones = () => apiRequest('/api/prestadores/me/calificaciones')
