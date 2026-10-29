export const SOLICITUD_INICIAL = { servicio: '', descripcion: '', direccion: '', contactoPreferido: '' }

export function validarSolicitud(datos, prestador) {
  const errores = {}
  if (!prestador?.id) errores.prestador = 'Seleccioná un prestador válido.'
  if (!datos.servicio) errores.servicio = 'Seleccioná un servicio.'
  else if (!prestador?.oficios?.includes(datos.servicio)) errores.servicio = 'El prestador no ofrece el servicio seleccionado.'
  const descripcion = (datos.descripcion || '').trim()
  if (!descripcion || descripcion.length > 1000) errores.descripcion = 'La descripción es obligatoria y admite hasta 1000 caracteres.'
  return errores
}

export function construirSolicitud(datos, prestador) {
  const oficio = prestador.oficiosCatalogo?.find((item) => item.nombre === datos.servicio)
  if (!oficio?.id) throw new Error('No se pudo identificar el oficio. Actualizá la ficha del prestador.')
  return { prestadorId: prestador.id, oficioId: oficio.id, descripcion: datos.descripcion.trim(), direccion: datos.direccion.trim(), contactoPreferido: datos.contactoPreferido?.trim() || '' }
}
