import { formatearFechaArgentina } from './fechas'
import { normalizarRol, ROLES } from './roles'

// Propuesta pendiente de backend, no validaciones de una API existente.
export const CATEGORIAS_CONSULTA = { SOLICITUDES: 'Solicitudes', PAGOS: 'Pagos', CUENTA: 'Cuenta', OTRAS: 'Otras consultas' }
export const ESTADOS_CONSULTA = { PENDIENTE: 'Pendiente', RESPONDIDA: 'Respondida', CERRADA: 'Cerrada' }
export const LIMITE_CONSULTAS = 20

export function puedeUsarConsultas(usuario, administracion) {
  const rol = normalizarRol(usuario?.rol)
  return Boolean(usuario?.id) && (administracion ? rol === ROLES.ADMINISTRADOR : [ROLES.CLIENTE, ROLES.PRESTADOR].includes(rol))
}

function textoValido(valor, maximo) {
  return typeof valor === 'string' && valor.trim().length > 0 && valor.trim().length <= maximo
}

export function validarNuevaConsulta(datos) {
  const errores = {}
  if (!Object.hasOwn(CATEGORIAS_CONSULTA, datos.categoria)) errores.categoria = 'Elegí una categoría.'
  if (!textoValido(datos.asunto, 100)) errores.asunto = 'El asunto debe tener entre 1 y 100 caracteres.'
  if (!textoValido(datos.mensaje, 2000)) errores.mensaje = 'El mensaje debe tener entre 1 y 2000 caracteres.'
  return errores
}

export function validarRespuesta(texto) {
  return textoValido(texto, 2000)
}

export function consultaPermitida(consulta, usuario, administracion) {
  return puedeUsarConsultas(usuario, administracion) && consulta &&
    typeof consulta.id === 'string' && consulta.id.length > 0 &&
    typeof consulta.autorId === 'string' && consulta.autorId.length > 0 &&
    (administracion || consulta.autorId === usuario.id) &&
    Object.keys(validarNuevaConsulta(consulta)).length === 0 &&
    Object.hasOwn(ESTADOS_CONSULTA, consulta.estado) &&
    formatearFechaArgentina(consulta.fechaCreacion) !== 'No disponible' &&
    (consulta.respuesta === null ? consulta.estado !== 'RESPONDIDA' :
      consulta.estado !== 'PENDIENTE' && validarRespuesta(consulta.respuesta?.mensaje) &&
      formatearFechaArgentina(consulta.respuesta?.fechaCreacion) !== 'No disponible')
}

export function paginaConsultasValida(resultado, pagina, estado, usuario, administracion) {
  return resultado?.pagina === pagina && Number.isSafeInteger(resultado.total) && resultado.total >= 0 &&
    resultado.totalPaginas === Math.max(1, Math.ceil(resultado.total / LIMITE_CONSULTAS)) &&
    pagina <= resultado.totalPaginas && Array.isArray(resultado.datos) &&
    resultado.datos.length <= LIMITE_CONSULTAS && resultado.datos.length <= resultado.total &&
    new Set(resultado.datos.map(consulta => consulta?.id)).size === resultado.datos.length &&
    resultado.datos.every(consulta => consultaPermitida(consulta, usuario, administracion) && (!estado || consulta.estado === estado))
}

export function errorConsulta(error) {
  const mensajes = {
    400: 'Revisá los datos de la consulta.',
    401: 'Tu sesión venció. Volvé a iniciar sesión.',
    403: 'No tenés permiso para realizar esta operación.',
    404: 'La consulta no está disponible.',
    409: 'La consulta cambió. Volvé a consultarla antes de continuar.',
    500: 'El servidor no pudo completar la operación. Intentá nuevamente.',
  }
  return mensajes[error?.status] || 'No se pudo confirmar la operación. Intentá nuevamente.'
}
