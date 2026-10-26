export const SOLICITUD_INICIAL = {
  servicio: '',
  descripcion: '',
  direccion: '',
  fechaPreferida: '',
}

export function validarSolicitud(datos, prestador, fechaActual = new Date()) {
  const errores = {}

  if (!prestador?.id) {
    errores.prestador = 'Seleccioná un prestador válido.'
  }

  const oficios = prestador?.oficios || []

  if (!datos.servicio) {
    errores.servicio = 'Seleccioná un servicio.'
  } else if (!oficios.includes(datos.servicio)) {
    errores.servicio = 'El prestador no ofrece el servicio seleccionado.'
  }

  const descripcion = (datos.descripcion || '').trim()

  if (descripcion.length < 10 || descripcion.length > 1000) {
    errores.descripcion = 'La descripción debe tener entre 10 y 1000 caracteres.'
  }

  const direccion = (datos.direccion || '').trim()

  if (direccion.length < 5 || direccion.length > 200) {
    errores.direccion = 'La dirección debe tener entre 5 y 200 caracteres.'
  }

  if (datos.fechaPreferida) {
    const fecha = new Date(`${datos.fechaPreferida}T12:00:00`)

    if (
      Number.isNaN(fecha.getTime()) ||
      fecha.toDateString() !== fechaActual.toDateString() &&
      fecha < new Date(
        fechaActual.getFullYear(),
        fechaActual.getMonth(),
        fechaActual.getDate()
      )
    ) {
      errores.fechaPreferida = 'La fecha no puede ser anterior a hoy.'
    }
  }

  return errores
}

export function construirSolicitud(datos, prestador) {
  return {
    prestadorId: prestador.id,
    servicio: datos.servicio,
    descripcion: datos.descripcion.trim(),
    direccion: datos.direccion.trim(),
    ...(datos.fechaPreferida
      ? { fechaPreferida: datos.fechaPreferida }
      : {}),
  }
}
