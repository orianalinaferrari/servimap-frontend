import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { iniciarSesion, registrarUsuario, obtenerSesion, cerrarSesion } from '../services/authService'
import { obtenerToken, guardarToken, EVENTO_SESION_EXPIRADA } from '../services/sesionToken'
import { apiRequest } from '../services/apiClient'
import { BASE, instalarHttp, respuesta, jwtPrueba } from './helpers/contratos'
beforeEach(() => vi.stubEnv('VITE_API_URL', BASE))
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers() })
describe('JWT y autenticación real', () => {
  it('login envía password y separa token de usuario', async () => {
    const token = jwtPrueba(); const usuario = { id: 'u1', nombre: 'Persona', rol: 'CLIENTE' }
    const http = instalarHttp(() => respuesta({ token, usuario }))
    await expect(iniciarSesion('PERSONA@example.test', 'clave1234')).resolves.toEqual(usuario)
    expect(JSON.parse(http.mock.calls[0][1].body)).toEqual({ email: 'persona@example.test', password: 'clave1234' })
    expect(http.mock.calls[0][0]).toBe(BASE + '/api/auth/login')
    expect(http.mock.calls[0][1].headers.Authorization).toBeUndefined()
    expect(obtenerToken()).toBe(token)
  })
  it('registro envía únicamente el DTO admitido sin iniciar sesión', async () => {
    const datos = { nombre: 'Persona', dni: '12345678', email: 'persona@example.test', password: 'clave1234', rol: 'PRESTADOR' }
    const http = instalarHttp(() => respuesta({ id: 'u1', rol: 'PRESTADOR' },201))
    await registrarUsuario(datos)
    expect(http.mock.calls[0][0]).toBe(BASE + '/api/auth/register')
    expect(JSON.parse(http.mock.calls[0][1].body)).toEqual(datos)
    expect(obtenerToken()).toBeNull()
  })
  it('restaura con /api/auth/me y Bearer, sin cookies', async () => {
    const token = jwtPrueba(); guardarToken(token)
    const http = instalarHttp(() => respuesta({ id: 'u1', rol: 'CLIENTE', dni: '12345678' }))
    await expect(obtenerSesion()).resolves.toMatchObject({ id: 'u1' })
    expect(http.mock.calls[0][0]).toBe(BASE + '/api/auth/me')
    expect(http.mock.calls[0][1]).toMatchObject({ credentials: 'omit', headers: { Authorization: `Bearer ${token}` } })
  })
  it('sin token no consulta el perfil', async () => { expect(await obtenerSesion()).toBeNull(); expect(fetch).not.toHaveBeenCalled() })
  it('logout es exclusivamente local', async () => { guardarToken(jwtPrueba()); await cerrarSesion(); expect(obtenerToken()).toBeNull(); expect(fetch).not.toHaveBeenCalled() })
  it('rechaza tokens vencidos o malformados', () => { expect(() => guardarToken(jwtPrueba(Date.now()/1000-10))).toThrow(); expect(() => guardarToken('invalido')).toThrow(); expect(obtenerToken()).toBeNull() })
  it('expira la sesión durante su uso', () => {
    vi.useFakeTimers(); guardarToken(jwtPrueba(Date.now()/1000+1)); const aviso=vi.fn(); window.addEventListener(EVENTO_SESION_EXPIRADA,aviso)
    vi.advanceTimersByTime(2000); expect(obtenerToken()).toBeNull(); expect(aviso).toHaveBeenCalledTimes(1); window.removeEventListener(EVENTO_SESION_EXPIRADA,aviso)
  })
  it('401 protegido invalida token y notifica; 403 no lo elimina', async () => {
    const token=jwtPrueba(); guardarToken(token); const http=instalarHttp(()=>respuesta({error:'Sin permisos'},403))
    await expect(apiRequest('/api/solicitudes')).rejects.toMatchObject({status:403}); expect(obtenerToken()).toBe(token)
    http.mockResolvedValueOnce(respuesta({error:'Token vencido'},401)); await expect(apiRequest('/api/solicitudes')).rejects.toMatchObject({status:401}); expect(obtenerToken()).toBeNull()
  })
  it('un fallo de red al restaurar no borra un JWT válido', async () => {
    const token=jwtPrueba(); guardarToken(token); instalarHttp(()=>{throw Error('Red')}); await expect(obtenerSesion()).rejects.toThrow(); expect(obtenerToken()).toBe(token)
  })
  it.each([400,401,403])('login propaga el rechazo HTTP %s sin guardar tokens', async(status)=>{
    instalarHttp(()=>respuesta({error:'Credenciales rechazadas'},status)); await expect(iniciarSesion('a@b.test','clave')).rejects.toMatchObject({status}); expect(obtenerToken()).toBeNull()
  })
})
