export function validarCambioContrasena({ passwordActual, passwordNueva }) {
  if (typeof passwordActual !== 'string' || !passwordActual || typeof passwordNueva !== 'string' || !passwordNueva) {
    throw new Error('Ingresá la contraseña actual y la nueva.')
  }
  if (passwordNueva.length < 8) throw new Error('La contraseña nueva debe tener al menos 8 caracteres.')
  if (passwordNueva === passwordActual) throw new Error('La contraseña nueva debe ser distinta de la actual.')
}
