import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  obtenerSolicitudesCliente,
  cancelarSolicitudCliente,
} from '../services/solicitudesClienteService'

function configurarApi() {
  vi.stubEnv('VITE_API_URL', 'https://api.example.test')
  vi.stubEnv('VITE_SOLICITUDES_CLIENTE_ENDPOINT', '/solicitudes/mis-solicitudes')
  vi.stubEnv(
    'VITE_CANCELAR_SOLICITUD_ENDPOINT',
    '/solicitudes/mis-solicitudes/:id/cancelar'
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('F-12 - Servicio HTTP de solicitudes del cliente', () => {
  test('requiere configuración de API', async () => {
    vi.stubEnv('VITE_API_URL', '')
    vi.stubEnv('VITE_SOLICITUDES_CLIENTE_ENDPOINT', '')

    await expect(obtenerSolicitudesCliente()).rejects.toThrow(
      'El servicio de consulta de solicitudes todavía no está configurado.'
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

    await expect(obtenerSolicitudesCliente()).resolves.toEqual([{ id: 1 }])

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/solicitudes/mis-solicitudes',
      { credentials: 'include' }
    )
  })

  test('acepta una respuesta con propiedad solicitudes', async () => {
    configurarApi()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        solicitudes: [{ id: 2 }],
      }),
    }))

    await expect(obtenerSolicitudesCliente()).resolves.toEqual([{ id: 2 }])
  })

  test('rechaza respuestas con formato incorrecto', async () => {
    configurarApi()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ otro: true }),
    }))

    await expect(obtenerSolicitudesCliente()).rejects.toThrow(
      'El servidor devolvió un formato de solicitudes no reconocido.'
    )
  })

  test('rechaza sesiones no autenticadas', async () => {
    configurarApi()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    }))

    await expect(obtenerSolicitudesCliente()).rejects.toThrow(
      'Debés iniciar sesión'
    )
  })

  test('rechaza operaciones sin permisos', async () => {
    configurarApi()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
    }))

    await expect(obtenerSolicitudesCliente()).rejects.toThrow(
      'No tenés permiso'
    )
  })

  test('cancela mediante PATCH con sesión', async () => {
    configurarApi()

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    })

    vi.stubGlobal('fetch', fetchMock)

    await cancelarSolicitudCliente(101)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/solicitudes/mis-solicitudes/101/cancelar',
      {
        credentials: 'include',
        method: 'PATCH',
      }
    )
  })

  test('rechaza identificadores inválidos', async () => {
    configurarApi()

    await expect(cancelarSolicitudCliente('')).rejects.toThrow(
      'El identificador de la solicitud no es válido.'
    )
  })

  test('requiere configurar la ruta de cancelación', async () => {
    configurarApi()
    vi.stubEnv('VITE_CANCELAR_SOLICITUD_ENDPOINT', '')

    await expect(cancelarSolicitudCliente(101)).rejects.toThrow(
      'La operación de cancelación todavía no está configurada.'
    )
  })

  test('informa conflictos de estado', async () => {
    configurarApi()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
    }))

    await expect(cancelarSolicitudCliente(101)).rejects.toThrow(
      'La solicitud cambió de estado'
    )
  })

  test('informa errores de conexión', async () => {
    configurarApi()

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(
      new Error('Network error')
    ))

    await expect(obtenerSolicitudesCliente()).rejects.toThrow(
      'No se pudo conectar con el servidor.'
    )
  })
})
