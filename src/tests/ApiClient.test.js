import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  ApiError,
  apiRequest,
  obtenerApiUrl,
} from '../services/apiClient'

beforeEach(() => {
  vi.stubEnv('VITE_API_URL', 'https://api.example.test/')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('F-24 - Cliente HTTP centralizado', () => {
  it('normaliza la URL base', () => {
    expect(obtenerApiUrl()).toBe('https://api.example.test')
  })

  it('rechaza una URL no configurada', () => {
    vi.stubEnv('VITE_API_URL', '')

    expect(() => obtenerApiUrl()).toThrow(ApiError)
  })

  it('realiza solicitudes con cookies de sesión', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{"id":1}',
    })

    vi.stubGlobal('fetch', fetchMock)

    const resultado = await apiRequest('/auth/me')

    expect(resultado).toEqual({ id: 1 })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, opciones] = fetchMock.mock.calls[0]

    expect(url).toBe('https://api.example.test/auth/me')
    expect(opciones.credentials).toBe('include')
  })

  it('envía JSON en solicitudes POST', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () => '{"creada":true}',
    })

    vi.stubGlobal('fetch', fetchMock)

    await apiRequest('/solicitudes', {
      method: 'POST',
      json: { descripcion: 'Prueba' },
    })

    const opciones = fetchMock.mock.calls[0][1]

    expect(opciones.method).toBe('POST')
    expect(opciones.body).toBe(
      JSON.stringify({ descripcion: 'Prueba' })
    )
    expect(opciones.headers['Content-Type']).toBe(
      'application/json'
    )
  })

  it('envía Bearer cuando se proporciona un token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    })

    vi.stubGlobal('fetch', fetchMock)

    await apiRequest('/privado', {
      token: 'token-de-prueba',
    })

    const opciones = fetchMock.mock.calls[0][1]

    expect(opciones.headers.Authorization).toBe(
      'Bearer token-de-prueba'
    )
  })

  it('no envía Bearer si no se proporciona token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    })

    vi.stubGlobal('fetch', fetchMock)

    await apiRequest('/privado')

    const opciones = fetchMock.mock.calls[0][1]

    expect(opciones.headers).toBeUndefined()
  })

  it('devuelve null para HTTP 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    }))

    await expect(apiRequest('/recurso')).resolves.toBeNull()
  })

  it.each([400, 401, 403, 404, 409, 500])(
    'conserva el estado HTTP %i',
    async (status) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status,
      }))

      await expect(
        apiRequest('/recurso')
      ).rejects.toMatchObject({
        name: 'ApiError',
        status,
        codigo: 'ERROR_HTTP',
      })
    }
  )

  it('identifica errores de red', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error'))
    )

    await expect(
      apiRequest('/recurso')
    ).rejects.toMatchObject({
      codigo: 'ERROR_RED',
    })
  })

  it('identifica respuestas JSON inválidas', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'respuesta-invalida',
    }))

    await expect(
      apiRequest('/recurso')
    ).rejects.toMatchObject({
      codigo: 'JSON_INVALIDO',
    })
  })

  it('rechaza rutas externas', async () => {
    await expect(
      apiRequest('//otro-servidor/recurso')
    ).rejects.toMatchObject({
      codigo: 'RUTA_INVALIDA',
    })
  })
})
