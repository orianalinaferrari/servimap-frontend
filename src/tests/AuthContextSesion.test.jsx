import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { useEffect } from 'react'
import { AuthProvider } from '../context/AuthContext'
import { useAuth } from '../context/useAuth'
import { BASE, instalarHttp, jwtPrueba, respuesta } from './helpers/contratos'

let contexto
const exponer = (valor) => { contexto = valor }
function Consumidor() {
  const auth = useAuth()
  useEffect(() => exponer(auth))
  return <output>{auth.cargando ? 'cargando' : auth.usuario?.nombre || 'sin sesión'}{auth.sesionExpirada ? ' · expirada' : ''}</output>
}
const usuarioMe = { id: 'u1', nombre: 'Delfina Favonio', email: 'delfina@example.test', rol: 'CLIENTE', dni: '12345678' }

beforeEach(() => { vi.stubEnv('VITE_API_URL', BASE); sessionStorage.clear() })
afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); sessionStorage.clear() })

describe('AuthProvider con /api/auth/me', () => {
  it('restaura la sesión al recargar y revalida con datos actualizados de /me', async () => {
    sessionStorage.setItem('servimap-jwt', jwtPrueba())
    let actual = usuarioMe
    instalarHttp((url) => url.pathname === '/api/auth/me' && respuesta(actual))
    render(<AuthProvider><Consumidor /></AuthProvider>)
    expect(await screen.findByText('Delfina Favonio')).toBeInTheDocument()
    actual = { ...usuarioMe, nombre: 'Delfina F.' }
    await act(async () => expect(await contexto.revalidarSesion()).toEqual(actual))
    expect(screen.getByText('Delfina F.')).toBeInTheDocument()
  })
  it('marca la sesión como expirada si /me deja de reconocer el token', async () => {
    sessionStorage.setItem('servimap-jwt', jwtPrueba())
    const http = instalarHttp((url) => url.pathname === '/api/auth/me' && respuesta(usuarioMe))
    render(<AuthProvider><Consumidor /></AuthProvider>)
    await screen.findByText('Delfina Favonio')
    http.mockResolvedValueOnce(respuesta({ error: 'Token vencido' }, 401))
    await act(async () => expect(await contexto.revalidarSesion()).toBeNull())
    expect(screen.getByText('sin sesión · expirada')).toBeInTheDocument()
    expect(sessionStorage.getItem('servimap-jwt')).toBeNull()
  })
  it('descarta una revalidación superada por un cierre de sesión', async () => {
    sessionStorage.setItem('servimap-jwt', jwtPrueba())
    let liberar
    const http = instalarHttp((url) => url.pathname === '/api/auth/me' && respuesta(usuarioMe))
    render(<AuthProvider><Consumidor /></AuthProvider>)
    await screen.findByText('Delfina Favonio')
    http.mockImplementationOnce(() => new Promise((resolve) => { liberar = () => resolve(respuesta(usuarioMe)) }))
    let pendiente
    act(() => { pendiente = contexto.revalidarSesion() })
    await act(async () => { await contexto.logout() })
    await act(async () => { liberar(); expect(await pendiente).toBeNull() })
    expect(screen.getByText('sin sesión')).toBeInTheDocument()
  })
  it('no inicia sesión si la verificación inicial falla por un error del servidor', async () => {
    sessionStorage.setItem('servimap-jwt', jwtPrueba())
    instalarHttp((url) => url.pathname === '/api/auth/me' && respuesta({ error: 'Caído' }, 500))
    render(<AuthProvider><Consumidor /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('sin sesión')).toBeInTheDocument())
  })
})
