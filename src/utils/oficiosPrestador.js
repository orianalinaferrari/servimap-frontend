export const OFICIOS_PERMITIDOS = [
  'Plomero',
  'Electricista',
  'Gasista',
  'Pintor',
  'Carpintero',
  'Cerrajero',
  'Jardinero',
]

const ALIAS_OFICIOS = {
  plomeria: 'Plomero',
  plomero: 'Plomero',
  electricidad: 'Electricista',
  electricista: 'Electricista',
  gasista: 'Gasista',
  pintura: 'Pintor',
  pintor: 'Pintor',
  carpinteria: 'Carpintero',
  carpintero: 'Carpintero',
  cerrajeria: 'Cerrajero',
  cerrajero: 'Cerrajero',
  jardineria: 'Jardinero',
  jardinero: 'Jardinero',
}

function normalizarTexto(valor) {
  return String(valor ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function normalizarOficio(valor) {
  return ALIAS_OFICIOS[normalizarTexto(valor)] ?? null
}

export function obtenerOficiosValidos(valor) {
  const lista = Array.isArray(valor)
    ? valor
    : String(valor ?? '').split(',')

  const resultado = []

  for (const oficio of lista) {
    const normalizado = normalizarOficio(oficio)

    if (normalizado && !resultado.includes(normalizado)) {
      resultado.push(normalizado)
    }
  }

  return resultado
}

export function validarOficios(valor) {
  const lista = Array.isArray(valor)
    ? valor
    : String(valor ?? '').split(',')

  const noVacios = lista.filter(
    (oficio) => String(oficio).trim() !== ''
  )

  if (noVacios.length === 0) {
    return 'Seleccioná al menos un oficio'
  }

  if (noVacios.some((oficio) => !normalizarOficio(oficio))) {
    return 'Hay oficios que no están permitidos'
  }

  const normalizados = noVacios.map(normalizarOficio)

  if (new Set(normalizados).size !== normalizados.length) {
    return 'No se permiten oficios duplicados'
  }

  return null
}
