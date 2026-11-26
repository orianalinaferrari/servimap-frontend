import { obtenerApiUrl } from './apiClient'

// Declaración de despliegue verificado por el equipo, nunca detección por respuesta.
// Sin ambas variables se conserva el contrato anterior y los filtros locales.
export function filtrosRemotosPrestadoresHabilitados() {
  const contrato = import.meta.env.VITE_PRESTADORES_CONTRATO_FILTROS?.trim() || ''
  const origen = import.meta.env.VITE_PRESTADORES_FILTROS_API_ORIGIN?.trim() || ''
  if (!contrato && !origen) return false
  if (contrato !== 'zona-presupuesto-v1' || origen !== obtenerApiUrl()) {
    throw new Error('La activación de filtros remotos no coincide con el contrato y el origen de API configurados.')
  }
  return true
}

export function prepararFiltrosRemotos({ zona, presupuesto } = {}) {
  const parametros = {}
  const errores = {}
  if (zona != null && zona !== '') {
    if (typeof zona !== 'string' || zona.trim().length > 100) errores.zona = 'La zona debe ser un texto de hasta 100 caracteres.'
    else if (zona.trim()) parametros.zona = zona.trim()
  }
  if (presupuesto != null && presupuesto !== '' && !(typeof presupuesto === 'string' && !presupuesto.trim())) {
    const monto = ['string', 'number'].includes(typeof presupuesto) ? Number(presupuesto) : NaN
    if (!Number.isFinite(monto) || monto < 0) {
      errores.presupuesto = 'El presupuesto debe ser un número finito mayor o igual a cero.'
    } else parametros.presupuesto = monto
  }
  return { parametros, errores }
}
