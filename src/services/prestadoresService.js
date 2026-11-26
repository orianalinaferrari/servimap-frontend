import { apiRequest } from './apiClient'

import { obtenerToken } from './sesionToken'

export const EVENTO_PERFIL_PRESTADOR_ACTUALIZADO = 'servimap:perfil-prestador-actualizado'

export const listarOficios = () => apiRequest('/api/oficios', { autenticar: false })
export const listarTodosLosOficios = () => apiRequest('/api/oficios/todos')
export const crearOficioRemoto = (datos) => apiRequest('/api/oficios', { method: 'POST', json: datos })
export const actualizarOficio = (id, datos) => apiRequest(`/api/oficios/${encodeURIComponent(id)}`, { method: 'PUT', json: datos })
export const cambiarEstadoOficioRemoto = (id, activo) => apiRequest(`/api/oficios/${encodeURIComponent(id)}/estado`, { method: 'PATCH', json: { activo } })

export function adaptarPrestador(datos) {
  const formatoInvalido = () => { throw new Error('El servidor devolvió un formato de prestadores no reconocido.') }
  if (!datos || typeof datos !== 'object' || Array.isArray(datos) ||
      !['string', 'number'].includes(typeof datos.id) || !String(datos.id).trim() || (typeof datos.id === 'number' && !Number.isFinite(datos.id)) ||
      typeof datos.nombre !== 'string' ||
      ['zonaCobertura', 'descripcionProfesional', 'telefono', 'whatsapp', 'emailContacto', 'fotoPerfil'].some(campo => datos[campo] != null && typeof datos[campo] !== 'string')) formatoInvalido()
  const oficiosCatalogo = datos.oficios ?? []
  if (!Array.isArray(oficiosCatalogo) || oficiosCatalogo.some(oficio => !oficio || typeof oficio.nombre !== 'string') ||
      (datos.comentarios != null && (!Array.isArray(datos.comentarios) || datos.comentarios.some(comentario =>
        !comentario || !Number.isInteger(comentario.puntaje) || comentario.puntaje < 1 || comentario.puntaje > 5 ||
        ['comentario', 'clienteNombre', 'fechaPublicacion'].some(campo => comentario[campo] != null && typeof comentario[campo] !== 'string')))) ||
      (datos.reputacion != null && (typeof datos.reputacion !== 'object' || Array.isArray(datos.reputacion))) ||
      (datos.reputacion?.promedio != null && (!Number.isFinite(datos.reputacion.promedio) || datos.reputacion.promedio < 0 || datos.reputacion.promedio > 5)) ||
      ['serviciosFinalizados', 'totalCalificaciones'].some(campo => datos.reputacion?.[campo] != null && (!Number.isSafeInteger(datos.reputacion[campo]) || datos.reputacion[campo] < 0))) formatoInvalido()
  return {
    ...datos,
    oficiosCatalogo,
    oficios: oficiosCatalogo.map((oficio) => oficio.nombre),
    calificacionPromedio: datos.reputacion?.promedio ?? null,
    trabajosFinalizados: datos.reputacion?.serviciosFinalizados ?? 0,
    comentarios: (datos.comentarios || []).map((comentario) => ({ ...comentario, prestadorId: datos.id })),
  }
}

export function normalizarPaginaPrestadores(respuesta) {
  if (Array.isArray(respuesta)) {
    return { registros: respuesta.map(adaptarPrestador), paginada: false, totalRegistros: null, pagina: null, limite: null, totalPaginas: null }
  }
  const entero = valor => Number.isSafeInteger(valor) && valor >= 0
  if (!respuesta || !Array.isArray(respuesta.registros) ||
      !entero(respuesta.totalRegistros) || !entero(respuesta.pagina) || respuesta.pagina < 1 ||
      !entero(respuesta.limite) || respuesta.limite < 1 || respuesta.limite > 50 ||
      !entero(respuesta.totalPaginas) || respuesta.totalPaginas !== Math.ceil(respuesta.totalRegistros / respuesta.limite) ||
      respuesta.registros.length !== Math.max(0, Math.min(respuesta.limite, respuesta.totalRegistros - (respuesta.pagina - 1) * respuesta.limite))) {
    throw new Error('El servidor devolvió una paginación de prestadores no válida.')
  }
  const registros = respuesta.registros.map(adaptarPrestador)
  if (new Set(registros.map(registro => registro.id)).size !== registros.length) throw new Error('El servidor devolvió prestadores duplicados en la página.')
  return { registros, paginada: true, totalRegistros: respuesta.totalRegistros, pagina: respuesta.pagina, limite: respuesta.limite, totalPaginas: respuesta.totalPaginas }
}

export async function listarPrestadores(parametros = {}) {
  const consulta = { page: 1, limit: 50, ...parametros }
  const resultado = normalizarPaginaPrestadores(await apiRequest('/api/prestadores', { autenticar: false, parametros: consulta }))
  if (resultado.paginada && (resultado.pagina !== consulta.page || resultado.limite !== consulta.limit)) throw new Error('El servidor no confirmó la página solicitada.')
  return resultado
}
export const obtenerPrestador = async (id) => adaptarPrestador(await apiRequest(`/api/prestadores/${encodeURIComponent(id)}`, { autenticar: false }))
export async function listarMarcadores(parametros = {}) {
  const datos = await apiRequest('/api/prestadores/mapa', { autenticar: false, parametros })
  if (!Array.isArray(datos) || datos.some(dato => !dato ||
      !['string', 'number'].includes(typeof dato.id) || typeof dato.nombre !== 'string' ||
      ['oficioPrincipal', 'zonaCobertura'].some(campo => dato[campo] != null && typeof dato[campo] !== 'string'))) {
    throw new Error('El servidor devolvió ubicaciones públicas no válidas.')
  }
  return datos.map(dato => ({ ...dato, oficios: dato.oficioPrincipal ? [dato.oficioPrincipal] : [] }))
}
export const obtenerMiPerfil = () => apiRequest('/api/prestadores/me', { cache: 'no-store' })
export async function actualizarMiPerfil(datos) {
  const token = obtenerToken()
  const perfil = await apiRequest('/api/prestadores/me', { method: 'PUT', json: datos })
  if (token && obtenerToken() === token && perfil?.id) {
    window.dispatchEvent(new CustomEvent(EVENTO_PERFIL_PRESTADOR_ACTUALIZADO, { detail: perfil }))
  }
  return perfil
}
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
