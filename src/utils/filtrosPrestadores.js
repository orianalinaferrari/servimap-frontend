import { filtrarPrestadores, normalizar } from './filtrarPrestadores'

export const FILTROS_INICIALES = {
  oficio: '',
  zona: '',
  precioMaximo: '',
  calificacionMinima: '',
  soloDisponibles: false,
}

export function obtenerOpcionesFiltros(prestadores = []) {
  const oficios = new Set()
  const zonas = new Set()

  prestadores.forEach((prestador) => {
    prestador.oficios?.forEach((oficio) => oficios.add(oficio))

    if (prestador.zonaCobertura) {
      zonas.add(prestador.zonaCobertura)
    }
  })

  return {
    oficios: [...oficios].sort((a, b) => a.localeCompare(b, 'es')),
    zonas: [...zonas].sort((a, b) => a.localeCompare(b, 'es')),
  }
}

export function aplicarFiltrosPrestadores(prestadores = [], termino = '', filtros = {}) {
  const criterios = { ...FILTROS_INICIALES, ...filtros }

  return filtrarPrestadores(prestadores, termino).filter((prestador) => {
    if (
      criterios.oficio &&
      !prestador.oficios?.some(
        (oficio) => normalizar(oficio) === normalizar(criterios.oficio)
      )
    ) {
      return false
    }

    if (
      criterios.zona &&
      normalizar(prestador.zonaCobertura || '') !== normalizar(criterios.zona)
    ) {
      return false
    }

    if (criterios.precioMaximo !== '') {
      const presupuesto = Number(criterios.precioMaximo)

      if (
        !Number.isFinite(presupuesto) ||
        presupuesto < 0 ||
        !Number.isFinite(prestador.precioMin) ||
        prestador.precioMin > presupuesto
      ) {
        return false
      }
    }

    if (criterios.calificacionMinima !== '') {
      const minima = Number(criterios.calificacionMinima)

      if (
        !Number.isFinite(minima) ||
        prestador.calificacionPromedio == null ||
        prestador.calificacionPromedio < minima
      ) {
        return false
      }
    }

    if (criterios.soloDisponibles && !prestador.disponible) {
      return false
    }

    return true
  })
}

export function construirParametrosFiltros(termino = '', filtros = {}) {
  const criterios = { ...FILTROS_INICIALES, ...filtros }
  const parametros = new URLSearchParams()

  if (termino.trim()) {
    parametros.set('q', termino.trim())
  }

  if (criterios.oficio) {
    parametros.set('oficio', criterios.oficio)
  }

  if (criterios.zona) {
    parametros.set('zona', criterios.zona)
  }

  if (criterios.precioMaximo !== '') {
    parametros.set('precioMax', String(criterios.precioMaximo))
  }

  if (criterios.calificacionMinima !== '') {
    parametros.set('calificacionMin', String(criterios.calificacionMinima))
  }

  if (criterios.soloDisponibles) {
    parametros.set('disponible', 'true')
  }

  return parametros
}
