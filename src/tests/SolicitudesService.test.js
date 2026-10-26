import { afterEach, describe, expect, test, vi } from 'vitest'
import { crearSolicitud } from '../services/solicitudesService'

const datos = {
  prestadorId: 1,
  servicio: 'Plomero',
  descripcion: 'Reparar una pérdida de agua.',
  direccion: 'Av. Santa Fe 1234',
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

function configurarApi() {
  vi.stubEnv('VITE_API_URL', 'https://api.example.test')
  vi.stubEnv('VITE_SOLICITUDES_ENDPOINT', '/solicitudes')
}

describe('F-11 - Servicio HTTP de solicitudes', () => {
  test('rechaza el envío si falta configurar el backend', async () => {
    vi.stubEnv('VITE_API_URL', '')
    vi.stubEnv('VITE_SOLICITUDES_ENDPOINT', '')

    await expect(crearSolicitud(datos)).rejects.toThrow(
      'El servicio de solicitudes todavía no está configurado.'
    )
  })

  test('envía un POST con JSON y sesión', async () => {
    configurarApi()

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () => JSON.stringify({ id: 100 }),
    })

    vi.stubGlobal('fetch', fetchMock)

    const resultado = await crearSolicitud(datos)

    expect(resultado).toEqual({ id: 100 })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/solicitudes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(datos),
      }
    )
  })

  test('informa cuando la sesión no está autenticada', async () => {
    configurarApi()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    }))

    await expect(crearSolicitud(datos)).rejects.toThrow(
      'Debés iniciar sesión para crear una solicitud.'
    )
  })

  test('informa cuando el usuario no tiene permisos', async () => {
    configurarApi()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
    }))

    await expect(crearSolicitud(datos)).rejects.toThrow(
      'No tenés permiso para crear solicitudes.'
    )
  })

  test('informa errores de validación del servidor', async () => {
    configurarApi()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
    }))

    await expect(crearSolicitud(datos)).rejects.toThrow(
      'Los datos de la solicitud fueron rechazados.'
    )
  })

  test('informa errores de conexión', async () => {
    configurarApi()

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(
      new Error('Network error')
    ))

    await expect(crearSolicitud(datos)).rejects.toThrow(
      'No se pudo conectar con el servidor.'
    )
  })

  test('acepta una respuesta exitosa sin contenido', async () => {
    configurarApi()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    }))

    await expect(crearSolicitud(datos)).resolves.toEqual({
      confirmada: true,
    })
  })
})
