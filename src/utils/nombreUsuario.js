export function normalizarNombreUsuario(nombre) {
  if (typeof nombre !== 'string' || !nombre.trim()) throw new Error('El nombre es obligatorio.')
  const limpio = nombre.trim()
  if (limpio.length > 100) throw new Error('El nombre no puede superar los 100 caracteres.')
  return limpio
}
