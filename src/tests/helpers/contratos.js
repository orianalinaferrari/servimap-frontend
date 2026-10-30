import { vi } from 'vitest'
export const BASE = 'https://api.example.test'
export const jwtPrueba = (exp = Date.now() / 1000 + 3600) => `e30.${btoa(JSON.stringify({ exp }))}.firma-ficticia`
export function respuesta(dato, status = 200) {
  return { ok: status >= 200 && status < 300, status, text: async () => dato == null ? '' : JSON.stringify(dato), json: async () => dato }
}
export function instalarHttp(callback) {
  const mock = vi.fn(async (url, opciones = {}) => {
    const dato = await callback(new URL(url), opciones)
    if (!dato) throw new Error(`HTTP inesperado en prueba: ${opciones.method || 'GET'} ${new URL(url).pathname}`)
    return dato
  })
  vi.stubGlobal('fetch', mock)
  return mock
}

export const perfilPrueba = { id: 'p1', nombre: 'Nombre de prueba', email: 'usuario@example.test', descripcionProfesional: 'Descripción inicial', zonaCobertura: 'Zona de prueba', telefono: '', whatsapp: '', emailContacto: '', fotoPerfil: '', latitud: -34.123456, longitud: -58.123456, precioMin: 10, precioMax: 20, disponible: true, oficios: [{ id: 'o1', nombre: 'Plomero' }] }
