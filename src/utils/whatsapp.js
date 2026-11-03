export function obtenerEnlaceWhatsApp(valor) {
  if (typeof valor !== 'string') return null
  const numero = valor.trim()
  // Sin + no se puede distinguir un número nacional de uno internacional.
  // Solo quitar separadores de presentación, nunca inferir país o prefijos.
  if (!/^\+[1-9][0-9 ()-]*$/.test(numero)) return null
  const digitos = numero.replace(/[ ()-]/g, '').slice(1)
  // Criterio conservador para un contacto internacional, no valida su existencia.
  if (!/^[1-9]\d{7,14}$/.test(digitos)) return null
  return `https://wa.me/${digitos}`
}
