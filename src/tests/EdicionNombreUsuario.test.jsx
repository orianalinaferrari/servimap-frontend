import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { useEffect } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { useAuth } from '../context/useAuth'
import AvatarSesion from '../components/auth/AvatarSesion'
import PerfilCliente from '../pages/PerfilCliente'
import PerfilPrestador from '../pages/PerfilPrestador'
import { actualizarNombreCuenta } from '../services/authService'
import { guardarToken, obtenerToken } from '../services/sesionToken'
import { BASE, instalarHttp, respuesta, jwtPrueba, perfilPrueba } from './helpers/contratos'

let cuenta, token, http, auth
const original = { id: 'u1', nombre: 'Ana Pérez', email: 'ana@example.test', dni: '12345678', rol: 'CLIENTE', fechaRegistro: '2026-01-01T12:00:00.000Z' }
function Vista() {
  const contexto = useAuth()
  useEffect(() => { auth = contexto }, [contexto])
  if (contexto.cargando) return <p>Verificando sesión de prueba</p>
  if (!contexto.usuario) return <p>Sin sesión de prueba</p>
  return <><header><AvatarSesion usuario={contexto.usuario} /></header>{contexto.usuario.rol === 'PRESTADOR' ? <PerfilPrestador /> : <PerfilCliente />}</>
}
function montar() { return render(<AuthProvider><MemoryRouter><Vista /></MemoryRouter></AuthProvider>) }
const patches = () => http.mock.calls.filter(([, config]) => config.method === 'PATCH')
async function editar(nombre = '  Beatriz Gómez  ') {
  fireEvent.click(await screen.findByRole('button', { name: 'Editar nombre' }))
  fireEvent.change(screen.getByLabelText('Nombre y apellido'), { target: { value: nombre } })
  fireEvent.submit(screen.getByRole('form', { name: 'Editar datos de cuenta' }))
}
beforeEach(() => {
  vi.stubEnv('VITE_API_URL', BASE)
  cuenta = { ...original }
  token = jwtPrueba()
  guardarToken(token)
  http = instalarHttp((url, config) => {
    if (url.pathname === '/api/auth/login') return respuesta({ usuario: { ...cuenta }, token })
    if (url.pathname === '/api/auth/me') {
      if (config.method === 'PATCH') cuenta = { ...cuenta, nombre: JSON.parse(config.body).nombre }
      return respuesta({ ...cuenta })
    }
    if (url.pathname.endsWith('/calificaciones')) return respuesta([])
    if (url.pathname === '/api/prestadores/me') return respuesta({ ...perfilPrueba, id: 'p1', nombre: cuenta.nombre, email: cuenta.email, fotoPerfil: '' })
  })
})
afterEach(() => { cleanup(); vi.unstubAllEnvs() })

describe('Contrato de edición de nombre', () => {
  it('envía solo nombre por PATCH autenticado y recibe perfil plano', async () => {
    const actualizado = await actualizarNombreCuenta({ nombre: '  Beatriz Gómez ', dni: 'no enviar', email: 'otro@example.test', rol: 'ADMINISTRADOR' })
    const [url, config] = patches()[0]
    expect(url).toBe(BASE + '/api/auth/me')
    expect(config.headers).toMatchObject({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' })
    expect(JSON.parse(config.body)).toEqual({ nombre: 'Beatriz Gómez' })
    expect(actualizado).toEqual({ ...original, nombre: 'Beatriz Gómez' })
  })
  it.each([undefined, null, '', '   ', 'x'.repeat(101)])('rechaza nombre inválido sin HTTP: %j', async nombre => {
    await expect(actualizarNombreCuenta({ nombre })).rejects.toThrow(/obligatorio|100 caracteres/)
    expect(http).not.toHaveBeenCalled()
  })
  it('acepta el límite de 100 caracteres después de trim', async () => {
    expect((await actualizarNombreCuenta({ nombre: ` ${'x'.repeat(100)} ` })).nombre).toHaveLength(100)
  })
  it.each([null, {}, { usuario: original }, { ...original, nombre: 'Sin cambio' }])('rechaza éxito sin nombre confirmado: %j', async dato => {
    http.mockResolvedValueOnce(respuesta(dato))
    await expect(actualizarNombreCuenta({ nombre: 'Beatriz' })).rejects.toThrow('no confirmó el nombre')
  })
})

describe.each(['CLIENTE', 'PRESTADOR'])('Edición desde perfil %s', rol => {
  beforeEach(() => { cuenta.rol = rol })
  it('actualiza perfil, encabezado e iniciales, conserva datos y persiste al restaurar', async () => {
    const vista = montar()
    await editar()
    expect(await screen.findByText('Nombre actualizado en el servidor.')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Beatriz Gómez' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Ir a mi perfil' })).toHaveTextContent('BG')
    expect(screen.getByRole('button', { name: 'Ir a mi perfil' })).toHaveAttribute('title', 'Beatriz Gómez')
    expect(auth.usuario).toMatchObject({ ...original, rol, nombre: 'Beatriz Gómez' })
    expect(obtenerToken()).toBe(token)
    expect(patches()).toHaveLength(1)
    vista.unmount()
    montar()
    expect(await screen.findByRole('heading', { name: 'Beatriz Gómez' })).toBeVisible()
    expect(auth.usuario.dni).toBe(original.dni)
  })
  it.each(['   ', 'x'.repeat(101)])('valida el formulario sin guardar: %j', async nombre => {
    montar()
    await editar(nombre)
    expect(screen.getByRole('alert')).toHaveTextContent(/obligatorio|100 caracteres/)
    expect(patches()).toHaveLength(0)
    expect(auth.usuario.nombre).toBe(original.nombre)
  })
  it.each([400, 403, 500])('conserva nombre y borrador ante HTTP %s y permite reintentar', async status => {
    const handler = http.getMockImplementation()
    let rechazar = true
    http.mockImplementation((url, config) => config.method === 'PATCH' && rechazar
      ? respuesta({ error: 'Nombre rechazado por el servidor' }, status) : handler(url, config))
    montar()
    await editar()
    expect(await screen.findByRole('alert')).toHaveTextContent('Nombre rechazado por el servidor')
    expect(auth.usuario.nombre).toBe(original.nombre)
    expect(screen.getByLabelText('Nombre y apellido')).toHaveValue('  Beatriz Gómez  ')
    expect(screen.queryByText('Nombre actualizado en el servidor.')).toBeNull()
    rechazar = false
    fireEvent.submit(screen.getByRole('form'))
    expect(await screen.findByText('Nombre actualizado en el servidor.')).toBeVisible()
  })
  it('invalida sesión ante 401 sin anunciar un guardado', async () => {
    const handler = http.getMockImplementation()
    http.mockImplementation((url, config) => config.method === 'PATCH' ? respuesta({ error: 'Sesión vencida' }, 401) : handler(url, config))
    montar()
    await editar()
    expect(await screen.findByText('Sin sesión de prueba')).toBeVisible()
    expect(obtenerToken()).toBeNull()
    expect(auth.sesionExpirada).toBe(true)
    expect(screen.queryByText('Nombre actualizado en el servidor.')).toBeNull()
  })
  it('permite cancelar y bloquea envíos duplicados mientras espera al servidor', async () => {
    montar()
    fireEvent.click(await screen.findByRole('button', { name: 'Editar nombre' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(patches()).toHaveLength(0)
    let resolver
    const handler = http.getMockImplementation()
    http.mockImplementation((url, config) => config.method === 'PATCH'
      ? new Promise(resolve => { resolver = resolve }) : handler(url, config))
    await editar()
    fireEvent.submit(screen.getByRole('form'))
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    expect(screen.getByLabelText('Nombre y apellido')).toBeDisabled()
    expect(patches()).toHaveLength(1)
    expect(auth.usuario.nombre).toBe(original.nombre)
    await act(async () => resolver(respuesta({ ...cuenta, nombre: 'Beatriz Gómez' })))
    expect(screen.getByText('Nombre actualizado en el servidor.')).toBeVisible()
  })
  it('descarta una revalidación anterior que intenta restaurar el nombre viejo', async () => {
    montar()
    await screen.findByRole('button', { name: 'Editar nombre' })
    const anterior = { ...cuenta }
    let resolver, pendiente
    const handler = http.getMockImplementation()
    http.mockImplementation((url, config) => new URL(url).pathname === '/api/auth/me' && config.method !== 'PATCH'
      ? new Promise(resolve => { resolver = resolve }) : handler(url, config))
    act(() => { pendiente = auth.revalidarSesion() })
    await waitFor(() => expect(resolver).toBeTypeOf('function'))
    await editar()
    await screen.findByText('Nombre actualizado en el servidor.')
    await act(async () => { resolver(respuesta(anterior)); await pendiente })
    expect(auth.usuario.nombre).toBe('Beatriz Gómez')
    expect(screen.getByRole('heading', { name: 'Beatriz Gómez' })).toBeVisible()
  })
  it.each([200, 401])('ignora respuesta HTTP %s de una sesión reemplazada, incluso del mismo usuario', async status => {
    montar()
    await screen.findByRole('button', { name: 'Editar nombre' })
    const anterior = { ...cuenta, nombre: 'Nombre de sesión anterior' }
    let resolver
    const handler = http.getMockImplementation()
    http.mockImplementation((url, config) => config.method === 'PATCH'
      ? new Promise(resolve => { resolver = resolve }) : handler(url, config))
    await editar('Nombre de sesión anterior')
    await waitFor(() => expect(resolver).toBeTypeOf('function'))
    token = jwtPrueba(Date.now() / 1000 + 7200)
    await act(async () => { await auth.logout(); await auth.login(cuenta.email, 'clave-ficticia') })
    await act(async () => resolver(respuesta(status === 200 ? anterior : { error: 'Token anterior vencido' }, status)))
    expect(auth.usuario.nombre).toBe(original.nombre)
    expect(obtenerToken()).toBe(token)
    expect(screen.queryByText('Nombre actualizado en el servidor.')).toBeNull()
    expect(screen.queryByRole('form')).toBeNull()
    if (rol === 'PRESTADOR') expect(screen.getByRole('button', { name: 'Editar perfil' })).toBeEnabled()
  })
})

it.each(['id', 'email', 'dni', 'rol', 'fechaRegistro'])('rechaza una respuesta que altera el campo protegido %s', async campo => {
  const handler = http.getMockImplementation()
  http.mockImplementation((url, config) => config.method === 'PATCH'
    ? respuesta({ ...cuenta, nombre: 'Beatriz Gómez', [campo]: 'otro valor' }) : handler(url, config))
  montar()
  await editar()
  expect(await screen.findByRole('alert')).toHaveTextContent('no confirmó los datos de tu cuenta')
  expect(auth.usuario).toEqual(original)
  expect(screen.queryByText('Nombre actualizado en el servidor.')).toBeNull()
})

it('conserva el nombre de cuenta ante una respuesta profesional iniciada antes del PATCH', async () => {
  cuenta.rol = 'PRESTADOR'
  let resolver, primera = true
  const anterior = { ...perfilPrueba, nombre: cuenta.nombre }
  const handler = http.getMockImplementation()
  http.mockImplementation((url, config) => {
    if (new URL(url).pathname === '/api/prestadores/me' && primera) {
      primera = false
      return new Promise(resolve => { resolver = resolve })
    }
    return handler(url, config)
  })
  montar()
  await waitFor(() => expect(resolver).toBeTypeOf('function'))
  await act(async () => { await auth.actualizarNombre({ nombre: 'Beatriz Gómez' }) })
  await act(async () => resolver(respuesta(anterior)))
  expect(await screen.findByRole('heading', { name: 'Beatriz Gómez' })).toBeVisible()
  expect(auth.usuario.nombre).toBe('Beatriz Gómez')
})
