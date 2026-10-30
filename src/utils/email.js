// Bounded, linear validation; authoritative account validation belongs to the API.
export function esEmailValido(valor) {
  if (typeof valor !== 'string' || valor.length > 254 || /\s/.test(valor)) return false
  const partes = valor.split('@')
  if (partes.length !== 2 || !partes[0]) return false
  const dominio = partes[1]
  const punto = dominio.lastIndexOf('.')
  return punto > 0 && punto < dominio.length - 1
}
