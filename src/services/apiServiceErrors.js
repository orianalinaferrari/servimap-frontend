import { ApiError } from './apiClient'

export function traducirErrorApi(error, mensajes = {}) {
  if (!(error instanceof ApiError)) {
    throw error
  }

  if (error.codigo === 'ERROR_RED') {
    throw new Error('No se pudo conectar con el servidor.')
  }

  if (error.status && mensajes[error.status]) {
    throw new Error(mensajes[error.status])
  }

  if (error.codigo === 'JSON_INVALIDO' ||
      error.codigo === 'ERROR_RESPUESTA') {
    throw new Error('El servidor devolvió una respuesta no válida.')
  }

  throw new Error(
    mensajes.general || error.message
  )
}
