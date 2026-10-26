export async function crearSolicitud(datos) {
  const apiUrl = import.meta.env.VITE_API_URL
  const endpoint = import.meta.env.VITE_SOLICITUDES_ENDPOINT

  if (!apiUrl || !endpoint) {
    throw new Error(
      'El servicio de solicitudes todavía no está configurado.'
    )
  }

  if (!endpoint.startsWith('/') || endpoint.startsWith('//')) {
    throw new Error('La ruta de solicitudes no es válida.')
  }

  let respuesta

  try {
    respuesta = await fetch(
      `${apiUrl.replace(/\/$/, '')}${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(datos),
      }
    )
  } catch {
    throw new Error('No se pudo conectar con el servidor.')
  }

  if (respuesta.status === 401) {
    throw new Error('Debés iniciar sesión para crear una solicitud.')
  }

  if (respuesta.status === 403) {
    throw new Error('No tenés permiso para crear solicitudes.')
  }

  if (respuesta.status === 400 || respuesta.status === 422) {
    throw new Error('Los datos de la solicitud fueron rechazados.')
  }

  if (!respuesta.ok) {
    throw new Error('No se pudo crear la solicitud.')
  }

  if (respuesta.status === 204) {
    return { confirmada: true }
  }

  const contenido = await respuesta.text()

  return contenido ? JSON.parse(contenido) : { confirmada: true }
}
