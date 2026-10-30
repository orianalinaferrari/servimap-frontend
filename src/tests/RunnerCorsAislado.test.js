import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => { vi.restoreAllMocks(); vi.resetModules() })

function instalarServidorSimulado(permisivo = false) {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  const http = vi.fn(async (url, { method, headers }) => {
    if (!['GET', 'OPTIONS'].includes(method)) throw new Error('Escritura bloqueada por el test')
    expect(new URL(url).origin).toBe('https://servimap-backend.vercel.app')
    if (headers.Origin !== 'http://localhost:5173') {
      return new Response(null, { status: 403, headers: permisivo ? { 'Access-Control-Allow-Origin': '*' } : {} })
    }
    return new Response(method === 'GET' ? JSON.stringify({ error: 'Sin sesión' }) : null, {
      status: method === 'GET' ? 401 : 204,
      headers: {
        'Access-Control-Allow-Origin': headers.Origin,
        'Access-Control-Allow-Headers': ' Authorization , Content-Type ',
        'Access-Control-Allow-Methods': ' GET , POST , PUT , PATCH ',
        Vary: 'Origin',
      },
    })
  })
  vi.stubGlobal('fetch', http)
  return http
}

describe('Runner CORS con red completamente simulada', () => {
  it('comprueba preflight, formato con espacios y denegaciones sin ejecutar escrituras', async () => {
    const http = instalarServidorSimulado()
    await import('../../scripts/qa/cors-permisos-reales.mjs')
    expect(http).toHaveBeenCalledTimes(26)
    expect(http.mock.calls.every(([, opciones]) => ['GET', 'OPTIONS'].includes(opciones.method))).toBe(true)
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('"verificaciones":26'))
  })
  it('falla ante un CORS permisivo en vez de certificarlo como seguro', async () => {
    instalarServidorSimulado(true)
    await expect(import('../../scripts/qa/cors-permisos-reales.mjs')).rejects.toThrow()
  })
})
