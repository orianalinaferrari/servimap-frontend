import { validarOficios } from './oficiosPrestador'
import { esEmailValido } from './email'

export function crearPerfilInicial(usuario = {}) {
  return {
    nombre: usuario.nombre ?? '',
    apellido: usuario.apellido ?? '',
    telefono: usuario.telefono ?? '',
    email: usuario.email ?? '',
    oficios: Array.isArray(usuario.oficios)
      ? usuario.oficios.join(', ')
      : usuario.oficios ?? '',
    ubicacion: usuario.ubicacion ?? '',
    descripcion: usuario.descripcion ?? '',
  }
}

export function validarPerfilPrestador(perfil) {
  const errores = {}

  if (!perfil.nombre.trim()) {
    errores.nombre = 'El nombre es obligatorio'
  }

  if (!perfil.apellido.trim()) {
    errores.apellido = 'El apellido es obligatorio'
  }

  if (!perfil.telefono.trim()) {
    errores.telefono = 'El teléfono es obligatorio'
  }

  if (
    perfil.email.trim() &&
    !esEmailValido(perfil.email)
  ) {
    errores.email = 'Ingresá un correo válido'
  }

  const errorOficios = validarOficios(perfil.oficios)

  if (errorOficios) {
    errores.oficios = errorOficios
  }

  if (!perfil.ubicacion.trim()) {
    errores.ubicacion = 'La ubicación es obligatoria'
  }

  return errores
}
