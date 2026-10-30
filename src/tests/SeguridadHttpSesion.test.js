import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest, obtenerApiUrl, validarRutaApi } from '../services/apiClient'
import { expiracionToken, guardarToken, obtenerToken } from '../services/sesionToken'
import { jwtPrueba, respuesta } from './helpers/contratos'

afterEach(() => vi.unstubAllEnvs())

describe('Transporte y límites de sesión', () => {
  it.each(['http://api.example.test', 'https://api.example.test/api', 'https://user:pass@api.example.test', 'https://api.example.test?q=1', 'https://api.example.test/#x', 'javascript:alert(1)', 'no-url'])('rechaza configuración insegura %s antes de enviar credenciales', async (url) => {
    vi.stubEnv('VITE_API_URL', url)
    await expect(apiRequest('/api/auth/me', { token: 'privado' })).rejects.toMatchObject({ codigo: 'API_URL_INVALIDA' })
    expect(fetch).not.toHaveBeenCalled()
  })
  it.each(['http://localhost:5179', 'http://127.0.0.1:4195', 'http://[::1]:4195', 'https://api.example.test'])('conserva HTTPS y demos loopback: %s', (url) => {
    vi.stubEnv('VITE_API_URL', url)
    expect(obtenerApiUrl()).toBe(url)
  })
  it.each(['//evil.test', '/ruta?token=1', '/ruta#x', '/\\evil.test', null, 4])('rechaza rutas no admitidas: %s', (ruta) => {
    expect(() => validarRutaApi(ruta)).toThrow()
  })
  it.each([1e308, '9999999999', null, -1, 0])('no acepta expiraciones inválidas o desbordadas: %s', (exp) => {
    const token = jwtPrueba(exp)
    expect(expiracionToken(token)).toBe(0)
    expect(() => guardarToken(token)).toThrow()
    expect(obtenerToken()).toBeNull()
  })
  it('un 401 de una petición anterior no elimina una sesión nueva', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.test')
    const actual = jwtPrueba(Date.now() / 1000 + 7200)
    guardarToken(actual)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta({ error: 'Vencido' }, 401)))
    await expect(apiRequest('/api/auth/me', { token: 'sesion-anterior' })).rejects.toMatchObject({ status: 401 })
    expect(obtenerToken()).toBe(actual)
  })
  it('rechaza redirecciones y cookies aunque un llamador intente habilitarlas', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.test')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(null, 204)))
    await apiRequest('/api/auth/me', { credentials: 'include', redirect: 'follow', token: 'prueba' })
    expect(fetch).toHaveBeenCalledWith('https://api.example.test/api/auth/me', expect.objectContaining({ credentials: 'omit', redirect: 'error' }))
  })
})
