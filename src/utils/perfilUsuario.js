// Primer nombre + última palabra como primer apellido. Limitación conocida:
// en apellidos compuestos ("de la Torre") o dos apellidos se toma la última palabra.
export function obtenerIniciales(nombre) {
  const palabras = String(nombre ?? '')
    .normalize('NFC')
    .trim()
    .split(/[\s—]+/u)
    .map((palabra) => palabra.replace(/^[^\p{L}\p{N}]+/u, ''))
    .filter(Boolean)
  const extremos = palabras.length > 1 ? [palabras[0], palabras.at(-1)] : palabras
  return extremos.map((palabra) => Array.from(palabra)[0].toLocaleUpperCase('es-AR')).join('')
}

const tieneTexto = (valor) => typeof valor === 'string' && valor.trim() !== ''

// Criterio de completitud derivado solo de GET /api/prestadores/me, nunca de marcas locales.
export function camposPendientesPrestador(perfil) {
  if (!perfil) return []
  const pendientes = []
  if (!tieneTexto(perfil.descripcionProfesional)) pendientes.push('Descripción profesional')
  if (!tieneTexto(perfil.zonaCobertura)) pendientes.push('Zona de cobertura')
  if (!['telefono', 'whatsapp', 'emailContacto'].some((campo) => tieneTexto(perfil[campo]))) pendientes.push('Al menos un medio de contacto')
  if (!perfil.oficios?.length) pendientes.push('Al menos un oficio')
  return pendientes
}
