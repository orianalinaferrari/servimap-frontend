import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom/vitest'
import { AuthProvider } from '../context/AuthContext'
import { useAuth } from '../context/useAuth'
import AvatarSesion from '../components/auth/AvatarSesion'
import PerfilPrestador from '../pages/PerfilPrestador'
import PerfilCliente from '../pages/PerfilCliente'
import { actualizarMiPerfil } from '../services/prestadoresService'
import { EVENTO_SESION_EXPIRADA } from '../services/sesionToken'
import { BASE, instalarHttp, jwtPrueba, perfilPrueba, respuesta } from './helpers/contratos'

const foto = 'https://imagenes.example.test/ana.jpg'
let auth, usuario, perfil, http, token
function Consumidor({ mostrarPerfil }) {
  const contexto = useAuth()
  useEffect(() => { auth = contexto })
  if (contexto.cargando) return <p>Cargando sesión</p>
  if (!contexto.usuario) return <p>Sin sesión</p>
  return <><header className="app-header"><AvatarSesion usuario={contexto.usuario} /></header>{mostrarPerfil && (contexto.usuario.rol === 'PRESTADOR' ? <PerfilPrestador /> : <PerfilCliente />)}</>
}
function mostrar(mostrarPerfil = false) {
  return render(<AuthProvider><MemoryRouter><Consumidor mostrarPerfil={mostrarPerfil} /></MemoryRouter></AuthProvider>)
}
const avatar = () => screen.getByRole('button', { name: 'Ir a mi perfil' })
beforeEach(() => {
  vi.stubEnv('VITE_API_URL', BASE)
  usuario = { id: 'u1', nombre: 'Ana Pérez', rol: 'PRESTADOR' }
  perfil = { ...perfilPrueba, id: 'p1', nombre: usuario.nombre, fotoPerfil: foto }
  token = jwtPrueba()
  sessionStorage.setItem('servimap-jwt', token)
  http = instalarHttp((url, config) => {
    if (url.pathname === '/api/auth/me') return respuesta(usuario)
    if (url.pathname === '/api/auth/login') return respuesta({ usuario, token })
    if (url.pathname.endsWith('/calificaciones')) return respuesta([])
    if (url.pathname === '/api/prestadores/me') {
      if (config.method === 'PUT') perfil = { ...perfil, ...JSON.parse(config.body) }
      return respuesta(perfil)
    }
  })
})
afterEach(() => { cleanup(); vi.unstubAllEnvs() })
describe('Foto de sesión del prestador, desde el perfil privado', () => {
  it('recupera la foto tras restaurar sesión, con ID de usuario distinto del ID del perfil', async () => {
    mostrar()
    await waitFor(() => expect(avatar().querySelector('img')).toHaveAttribute('src', foto))
    expect(http.mock.calls.find(([url]) => url.endsWith('/api/prestadores/me'))[1]).toMatchObject({ cache: 'no-store', headers: { Authorization: `Bearer ${token}` } })
  })
  it.each([null, ''])('mantiene iniciales sin foto (%s)', async (valor) => {
    perfil.fotoPerfil = valor
    mostrar()
    await waitFor(() => expect(http.mock.calls.some(([url]) => url.endsWith('/api/prestadores/me'))).toBe(true))
    expect(avatar()).toHaveTextContent('AP')
    expect(avatar().querySelector('img')).toBeNull()
  })
  it('usa iniciales si falla la imagen y permite una URL nueva', async () => {
    mostrar()
    await waitFor(() => expect(avatar().querySelector('img')).not.toBeNull())
    fireEvent.error(avatar().querySelector('img'))
    expect(avatar()).toHaveTextContent('AP')
    await act(async () => { await actualizarMiPerfil({ fotoPerfil: 'https://imagenes.example.test/otra.jpg' }) })
    expect(avatar().querySelector('img')).toHaveAttribute('src', perfil.fotoPerfil)
  })
  it('no bloquea la sesión si no se puede consultar la foto', async () => {
    http.mockImplementation(async (url) => url.endsWith('/api/auth/me') ? respuesta(usuario) : respuesta({ error: 'No disponible' }, 500))
    mostrar()
    await waitFor(() => expect(http.mock.calls).toHaveLength(2))
    expect(avatar()).toHaveTextContent('AP')
    expect(auth.autenticado).toBe(true)
  })
  it.each(['https://imagenes.example.test/nueva.jpg', ''])('sincroniza el avatar inmediatamente después de guardar %j en el formulario', async (nueva) => {
    mostrar(true)
    fireEvent.click(await screen.findByRole('button', { name: 'Editar perfil' }))
    fireEvent.change(screen.getByLabelText('URL de foto de perfil'), { target: { value: nueva } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await screen.findByText('Perfil actualizado en el servidor.')
    if (nueva) expect(avatar().querySelector('img')).toHaveAttribute('src', nueva)
    else { expect(avatar().querySelector('img')).toBeNull(); expect(avatar()).toHaveTextContent('AP') }
    expect(auth.usuario.fotoPerfil).toBe(nueva)
    await act(async () => { await auth.revalidarSesion() })
    await waitFor(() => expect(auth.usuario.fotoPerfil).toBe(nueva))
  })
  it('recarga la foto confirmada desde el servidor al desmontar y restaurar la aplicación', async () => {
    const vista = mostrar()
    await waitFor(() => expect(avatar().querySelector('img')).not.toBeNull())
    await act(async () => { await actualizarMiPerfil({ fotoPerfil: 'https://imagenes.example.test/guardada.jpg' }) })
    vista.unmount(); mostrar()
    await waitFor(() => expect(avatar().querySelector('img')).toHaveAttribute('src', perfil.fotoPerfil))
    expect(sessionStorage.length).toBe(1) // Solo JWT; la foto se vuelve a consultar.
  })
  it('no cambia la foto ante un PUT rechazado', async () => {
    mostrar()
    await waitFor(() => expect(avatar().querySelector('img')).not.toBeNull())
    http.mockResolvedValueOnce(respuesta({ error: 'Rechazado' }, 400))
    await act(async () => { await expect(actualizarMiPerfil({ fotoPerfil: '' })).rejects.toThrow('Rechazado') })
    expect(avatar().querySelector('img')).toHaveAttribute('src', foto)
  })
  it('descarta un GET inicial antiguo que termina después de un PUT confirmado', async () => {
    let resolver
    http.mockImplementationOnce(async () => respuesta(usuario))
    http.mockImplementationOnce(() => new Promise((resolve) => { resolver = resolve }))
    mostrar()
    await waitFor(() => expect(resolver).toBeTypeOf('function'))
    await act(async () => { await actualizarMiPerfil({ fotoPerfil: '' }) })
    await act(async () => { resolver(respuesta({ ...perfil, fotoPerfil: foto })) })
    expect(avatar().querySelector('img')).toBeNull()
    expect(avatar()).toHaveTextContent('AP')
  })
  it.each(['GET', 'PUT'])('descarta una respuesta %s tardía de la cuenta anterior', async (metodo) => {
    let resolver, pendiente
    if (metodo === 'GET') {
      http.mockImplementationOnce(async () => respuesta(usuario))
      http.mockImplementationOnce(() => new Promise((resolve) => { resolver = resolve }))
    }
    mostrar()
    if (metodo === 'PUT') {
      await waitFor(() => expect(avatar().querySelector('img')).not.toBeNull())
      http.mockImplementationOnce(() => new Promise((resolve) => { resolver = resolve }))
      act(() => { pendiente = actualizarMiPerfil({ fotoPerfil: foto }) })
    }
    await waitFor(() => expect(resolver).toBeTypeOf('function'))
    await act(async () => { await auth.logout() })
    expect(screen.getByText('Sin sesión')).toBeInTheDocument()
    usuario = { id: 'u2', nombre: 'Bruno Díaz', rol: 'PRESTADOR' }
    perfil = { ...perfil, id: 'p2', nombre: usuario.nombre, fotoPerfil: 'https://imagenes.example.test/bruno.jpg' }
    token = jwtPrueba(Date.now() / 1000 + 7200)
    await act(async () => { await auth.login('bruno@example.test', 'clave-de-prueba') })
    await waitFor(() => expect(avatar().querySelector('img')).toHaveAttribute('src', perfil.fotoPerfil))
    await act(async () => { resolver(respuesta({ ...perfil, id: 'p1', fotoPerfil: foto })); await pendiente })
    expect(avatar().querySelector('img')).toHaveAttribute('src', perfil.fotoPerfil)
    expect(auth.usuario.id).toBe('u2')
  })
  it('borra la foto al expirar la sesión y al iniciar otra sin foto', async () => {
    mostrar()
    await waitFor(() => expect(avatar().querySelector('img')).not.toBeNull())
    act(() => { sessionStorage.clear(); window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA)) })
    expect(screen.getByText('Sin sesión')).toBeInTheDocument()
    perfil = { ...perfil, fotoPerfil: null }
    token = jwtPrueba(Date.now() / 1000 + 7200)
    await act(async () => { await auth.login('ana@example.test', 'clave-de-prueba') })
    await waitFor(() => expect(avatar()).toHaveTextContent('AP'))
    expect(avatar().querySelector('img')).toBeNull()
  })
})
describe('Cliente sin contrato de foto', () => {
  it.each([undefined, foto])('mantiene iniciales incluso con campo no contratado %j y no consulta un perfil de prestador', async (fotoPerfil) => {
    usuario = { id: 'c1', nombre: 'Carla López', rol: 'CLIENTE', fotoPerfil }
    mostrar(true)
    expect(await screen.findByRole('heading', { name: 'Carla López' })).toBeInTheDocument()
    expect(avatar()).toHaveTextContent('CL')
    expect(document.querySelector('img')).toBeNull()
    expect(http.mock.calls).toHaveLength(1)
    expect(http.mock.calls[0][0]).toBe(BASE + '/api/auth/me')
  })
})
