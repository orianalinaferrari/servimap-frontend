import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  marcarTrabajoTerminadoPrestador,
} from '../services/solicitudesPrestadorService'
import {
  confirmarFinalizacionCliente,
} from '../services/solicitudesClienteService'

function configurar() {
  vi.stubEnv('VITE_API_URL', 'https://api.example.test')
  vi.stubEnv(
    'VITE_SOLICITUDES_PRESTADOR_ENDPOINT',
    '/solicitudes/recibidas'
  )
  vi.stubEnv(
    'VITE_SOLICITUDES_CLIENTE_ENDPOINT',
    '/solicitudes/mis-solicitudes'
  )
  vi.stubEnv(
    'VITE_MARCAR_TRABAJO_TERMINADO_ENDPOINT',
    '/solicitudes/recibidas/:id/terminar'
  )
  vi.stubEnv(
    'VITE_CONFIRMAR_FINALIZACION_ENDPOINT',
    '/solicitudes/mis-solicitudes/:id/confirmar-finalizacion'
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('F-16 - Servicios de finalización', () => {
  test('el prestador informa finalización mediante PATCH', async () => {
    configurar()

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    })

    vi.stubGlobal('fetch', fetchMock)

    await marcarTrabajoTerminadoPrestador(101)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/solicitudes/recibidas/101/terminar',
      {
        credentials: 'include',
        method: 'PATCH',
      }
    )
  })

  test('el cliente confirma finalización mediante PATCH', async () => {
    configurar()

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    })

    vi.stubGlobal('fetch', fetchMock)

    await confirmarFinalizacionCliente(101)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/solicitudes/mis-solicitudes/101/confirmar-finalizacion',
      {
        credentials: 'include',
        method: 'PATCH',
      }
    )
  })

  test('rechaza identificadores inválidos', async () => {
    configurar()

    await expect(
      marcarTrabajoTerminadoPrestador('')
    ).rejects.toThrow('identificador')

    await expect(
      confirmarFinalizacionCliente('')
    ).rejects.toThrow('identificador')
  })

  test('no ejecuta operaciones sin endpoints configurados', async () => {
    configurar()

    vi.stubEnv('VITE_MARCAR_TRABAJO_TERMINADO_ENDPOINT', '')
    vi.stubEnv('VITE_CONFIRMAR_FINALIZACION_ENDPOINT', '')

    await expect(
      marcarTrabajoTerminadoPrestador(101)
    ).rejects.toThrow('no está configurada')

    await expect(
      confirmarFinalizacionCliente(101)
    ).rejects.toThrow('no está configurada')
  })

  test('informa conflictos de estado del servidor', async () => {
    configurar()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
    }))

    await expect(
      marcarTrabajoTerminadoPrestador(101)
    ).rejects.toThrow('cambió de estado')

    await expect(
      confirmarFinalizacionCliente(101)
    ).rejects.toThrow('cambió de estado')
  })

  test('informa errores de conexión', async () => {
    configurar()

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(
      new Error('Network error')
    ))

    await expect(
      marcarTrabajoTerminadoPrestador(101)
    ).rejects.toThrow('No se pudo conectar')

    await expect(
      confirmarFinalizacionCliente(101)
    ).rejects.toThrow('No se pudo conectar')
  })
})
