import { afterEach, beforeEach, vi } from 'vitest'
// Toda prueba automatizada usa HTTP simulado; nunca escribe en producción.
beforeEach(() => {
  sessionStorage.clear()
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('HTTP no simulado en esta prueba') }))
})
afterEach(() => { sessionStorage.clear(); vi.unstubAllGlobals() })
