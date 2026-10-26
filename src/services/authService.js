
const API_URL = import.meta.env.VITE_API_URL

export async function iniciarSesion(email, contrasena) {
  if (!API_URL) {
    throw new Error(
      'El servicio de autenticación todavía no está configurado.'
    )
  }

  let respuesta

  try {
    respuesta = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email,
        contrasena,
      }),
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor.')
  }

  if (respuesta.status === 401) {
    throw new Error('Email o contraseña incorrectos.')
  }

  if (!respuesta.ok) {
    throw new Error('Ocurrió un error al iniciar sesión.')
  }

  return respuesta.json()
}

export async function cerrarSesion() {
  if (!API_URL) {
    throw new Error(
      'El servicio de autenticación no está configurado.'
    )
  }

  const respuesta = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!respuesta.ok) {
    throw new Error('No se pudo cerrar la sesión.')
  }
}

export async function obtenerSesion() {
  if (!API_URL) {
    return null
  }

  const respuesta = await fetch(`${API_URL}/auth/me`, {
    credentials: 'include',
  })

  if (respuesta.status === 401) {
    return null
  }

  if (!respuesta.ok) {
    throw new Error('No se pudo verificar la sesión.')
  }

  return respuesta.json()
}
