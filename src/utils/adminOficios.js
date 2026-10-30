import { OFICIOS_PERMITIDOS } from './oficiosPrestador'

export const CLAVE_CATALOGO_OFICIOS = 'servimap-admin-catalogo-oficios'

export function crearCatalogoInicial() {
  return OFICIOS_PERMITIDOS.map((nombre, indice) => ({
    id: indice + 1,
    nombre,
    activo: true,
  }))
}

export function normalizarNombreOficio(nombre) {
  return String(nombre ?? '').trim().replace(/\s+/g, ' ')
}

function claveNombre(nombre) {
  return normalizarNombreOficio(nombre)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function validarNombreOficio(nombre, catalogo, idActual = null) {
  const limpio = normalizarNombreOficio(nombre)

  if (!limpio) {
    return 'Ingresá el nombre del oficio.'
  }

  if (limpio.length < 3) {
    return 'El nombre debe tener al menos 3 caracteres.'
  }

  if (limpio.length > 60) {
    return 'El nombre no puede superar los 60 caracteres.'
  }

  if (!/^[\p{L}\p{M}\s'-]+$/u.test(limpio)) {
    return 'El nombre solo puede contener letras, espacios, apóstrofes y guiones.'
  }

  const duplicado = catalogo.some(
    (oficio) =>
      oficio.id !== idActual &&
      claveNombre(oficio.nombre) === claveNombre(limpio)
  )

  if (duplicado) {
    return 'Ya existe un oficio con ese nombre.'
  }

  return null
}

export function crearOficio(catalogo, nombre) {
  const error = validarNombreOficio(nombre, catalogo)

  if (error) {
    throw new Error(error)
  }

  const siguienteId = Math.max(
    0,
    ...catalogo.map((oficio) => oficio.id)
  ) + 1

  return [
    ...catalogo,
    {
      id: siguienteId,
      nombre: normalizarNombreOficio(nombre),
      activo: true,
    },
  ]
}

export function modificarOficio(catalogo, id, nombre) {
  if (!catalogo.some((oficio) => oficio.id === id)) {
    throw new Error('No se encontró el oficio.')
  }

  const error = validarNombreOficio(nombre, catalogo, id)

  if (error) {
    throw new Error(error)
  }

  return catalogo.map((oficio) =>
    oficio.id === id
      ? { ...oficio, nombre: normalizarNombreOficio(nombre) }
      : oficio
  )
}

export function cambiarEstadoOficio(catalogo, id, activo) {
  if (!catalogo.some((oficio) => oficio.id === id)) {
    throw new Error('No se encontró el oficio.')
  }

  return catalogo.map((oficio) =>
    oficio.id === id ? { ...oficio, activo } : oficio
  )
}

export function validarCatalogoGuardado(valor) {
  if (!Array.isArray(valor)) {
    return null
  }

  const ids = new Set()
  const nombres = new Set()

  for (const oficio of valor) {
    if (
      !oficio ||
      !Number.isSafeInteger(oficio.id) ||
      oficio.id < 1 ||
      typeof oficio.nombre !== 'string' ||
      typeof oficio.activo !== 'boolean'
    ) {
      return null
    }

    if (
      ids.has(oficio.id) ||
      nombres.has(claveNombre(oficio.nombre)) ||
      validarNombreOficio(oficio.nombre, [])
    ) {
      return null
    }

    ids.add(oficio.id)
    nombres.add(claveNombre(oficio.nombre))
  }

  return valor
}

export function cargarCatalogoOficios() {
  try {
    const guardado = localStorage.getItem(CLAVE_CATALOGO_OFICIOS)

    if (!guardado) {
      return crearCatalogoInicial()
    }

    const catalogo = validarCatalogoGuardado(JSON.parse(guardado))

    return catalogo ?? crearCatalogoInicial()
  } catch {
    return crearCatalogoInicial()
  }
}

export function guardarCatalogoOficios(catalogo) {
  localStorage.setItem(
    CLAVE_CATALOGO_OFICIOS,
    JSON.stringify(catalogo)
  )
}
