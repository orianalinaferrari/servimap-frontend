import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  obtenerSolicitudesPrestador,
  aceptarSolicitudPrestador,
  rechazarSolicitudPrestador,
} from '../services/solicitudesPrestadorService'

function configurarApi() {
  vi.stubEnv('VITE_API_URL', 'https://api.example.test')
  vi.stubEnv(
    'VITE_SOLICITUDES_PRESTADOR_ENDPOINT',
    '/solicitudes/recibidas'
  )
  vi.stubEnv(
    'VITE_ACEPTAR_SOLICITUD_ENDPOINT',
    '/solicitudes/recibidas/:id/aceptar'
  )
  vi.stubEnv(
    'VITE_RECHAZAR_SOLICITUD_ENDPOINT',
    '/solicitudes/recibidas/:id/rechazar'
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('F-13 - Servicio HTTP del prestador', () => {
  test('requiere configuración de API', async () => {
    vi.stubEnv('VITE_API_URL', '')
    vi.stubEnv('VITE_SOLICITUDES_PRESTADOR_ENDPOINT', '')

    await expect(obtenerSolicitudesPrestador()).rejects.toThrow(
      'El servicio de solicitudes recibidas todavía no está configurado.'
    )
  })

  test('consulta solicitudes con sesión', async () => {
    configurarApi()

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([{ id: 1 }]),
    })

    vi.stubGlobal('fetch', fetchMock)

    await expect(obtenerSolicitudesPrestador()).resolves.toEqual([
      { id: 1 },
    ])

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/solicitudes/recibidas',
      { credentials: 'include' }
    )
  })

  test('acepta un objeto con propiedad solicitudes', async () => {
    configurarApi()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        solicitudes: [{ id: 2 }],
      }),
    }))

    await expect(obtenerSolicitudesPrestador()).resolves.toEqual([
      { id: 2 },
    ])
  })

  test('rechaza respuestas con formato incorrecto', async () => {
    configurarApi()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ otro: true }),
    }))

    await expect(obtenerSolicitudesPrestador()).rejects.toThrow(
      'El servidor devolvió un formato de solicitudes no reconocido.'
    )
  })

  test('rechaza sesiones no autenticadas', async () => {
    configurarApi()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    }))

    await expect(obtenerSolicitudesPrestador()).rejects.toThrow(
      'Debés iniciar sesión'
    )
  })

  test('rechaza operaciones sin permisos', async () => {
    configurarApi()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
    }))

    await expect(obtenerSolicitudesPrestador()).rejects.toThrow(
      'No tenés permiso'
    )
  })

  test('acepta mediante PATCH con sesión', async () => {
    configurarApi()

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    })

    vi.stubGlobal('fetch', fetchMock)

    await aceptarSolicitudPrestador(201)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/solicitudes/recibidas/201/aceptar',
      {
        credentials: 'include',
        method: 'PATCH',
      }
    )
  })

  test('rechaza mediante PATCH con sesión', async () => {
    configurarApi()

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    })

    vi.stubGlobal('fetch', fetchMock)

    await rechazarSolicitudPrestador(201)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/solicitudes/recibidas/201/rechazar',
      {
        credentials: 'include',
        method: 'PATCH',
      }
    )
  })

  test('rechaza identificadores inválidos', async () => {
    configurarApi()

    await expect(aceptarSolicitudPrestador('')).rejects.toThrow(
      'El identificador de la solicitud no es válido.'
    )
  })

  test('requiere configurar la ruta de aceptación', async () => {
    configurarApi()
    vi.stubEnv('VITE_ACEPTAR_SOLICITUD_ENDPOINT', '')

    await expect(aceptarSolicitudPrestador(201)).rejects.toThrow(
      'La operación todavía no está configurada.'
    )
  })

  test('requiere configurar la ruta de rechazo', async () => {
    configurarApi()
    vi.stubEnv('VITE_RECHAZAR_SOLICITUD_ENDPOINT', '')

    await expect(rechazarSolicitudPrestador(201)).rejects.toThrow(
      'La operación todavía no está configurada.'
    )
  })

  test('informa conflictos de estado', async () => {
    configurarApi()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
    }))

    await expect(aceptarSolicitudPrestador(201)).rejects.toThrow(
      'La solicitud cambió de estado'
    )
  })

  test('informa errores de conexión', async () => {
    configurarApi()

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(
      new Error('Network error')
    ))

    await expect(obtenerSolicitudesPrestador()).rejects.toThrow(
      'No se pudo conectar con el servidor.'
    )
  })
})
