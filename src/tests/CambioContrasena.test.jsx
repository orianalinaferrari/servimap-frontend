import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { useEffect } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { useAuth } from '../context/useAuth'
import PerfilCliente from '../pages/PerfilCliente'
import PerfilPrestador from '../pages/PerfilPrestador'
import CambioContrasena from '../components/perfil/CambioContrasena'
import { cambiarContrasenaCuenta } from '../services/authService'
import { guardarToken, obtenerToken, eliminarToken } from '../services/sesionToken'
import { BASE, instalarHttp, respuesta, jwtPrueba, perfilPrueba } from './helpers/contratos'

// Datos ficticios: no se consultan cuentas ni servicios reales.
const valores = { passwordActual: ' Actual ficticia ', passwordNueva: ' Nueva ficticia ' }
const exito = { mensaje: 'Contraseña actualizada' }
const usuario = { id: 'u1', nombre: 'Ana Pérez', email: 'ana@example.test', dni: '12345678', rol: 'CLIENTE' }
let cuenta, token, http, auth
function Vista() {
  const contexto = useAuth()
  useEffect(() => { auth = contexto }, [contexto])
  if (contexto.cargando) return <p>Cargando sesión de prueba</p>
  if (!contexto.usuario) return <p>Sin sesión de prueba</p>
  return <MemoryRouter>{contexto.usuario.rol === 'PRESTADOR' ? <PerfilPrestador /> : <PerfilCliente />}</MemoryRouter>
}
function montar() { return render(<AuthProvider><Vista /></AuthProvider>) }
const patches = () => http.mock.calls.filter(([, opciones]) => opciones.method === 'PATCH')
async function abrir() { fireEvent.click(await screen.findByRole('button', { name: 'Cambiar contraseña' })) }
function completar(datos = valores, confirmacion = datos.passwordNueva) {
  fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: datos.passwordActual ?? '' } })
  fireEvent.change(screen.getByLabelText('Contraseña nueva'), { target: { value: datos.passwordNueva ?? '' } })
  fireEvent.change(screen.getByLabelText('Confirmar contraseña nueva'), { target: { value: confirmacion ?? '' } })
}
function enviar() { fireEvent.submit(screen.getByRole('form', { name: 'Cambiar contraseña' })) }
beforeEach(() => {
  vi.stubEnv('VITE_API_URL', BASE)
  cuenta = { ...usuario }; token = jwtPrueba(); guardarToken(token)
  http = instalarHttp((url, opciones) => {
    if (url.pathname === '/api/auth/login') return respuesta({ usuario: cuenta, token })
    if (url.pathname === '/api/auth/me') return respuesta(cuenta)
    if (url.pathname === '/api/auth/me/password' && opciones.method === 'PATCH') return respuesta(exito)
    if (url.pathname.endsWith('/calificaciones')) return respuesta([])
    if (url.pathname === '/api/prestadores/me') return respuesta(perfilPrueba)
  })
})
afterEach(() => { cleanup(); vi.unstubAllEnvs() })

describe('Contrato PATCH de contraseña', () => {
  it('envía solo los dos campos por JSON y Bearer, sin trim', async () => {
    expect(await cambiarContrasenaCuenta({ ...valores, confirmacion: 'no enviar', rol: 'ADMINISTRADOR' })).toEqual(exito)
    const [url, opciones] = patches()[0]
    expect(url).toBe(BASE + '/api/auth/me/password')
    expect(opciones.headers).toMatchObject({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' })
    expect(JSON.parse(opciones.body)).toEqual(valores)
    expect(opciones.credentials).toBe('omit')
  })
  it.each([
    { passwordActual: '', passwordNueva: valores.passwordNueva },
    { passwordActual: valores.passwordActual, passwordNueva: '' },
    { passwordActual: null, passwordNueva: valores.passwordNueva },
    { passwordActual: valores.passwordActual, passwordNueva: 'corta' },
    { passwordActual: valores.passwordActual, passwordNueva: valores.passwordActual },
  ])('rechaza datos inválidos antes de enviar: %#', async datos => {
    await expect(cambiarContrasenaCuenta(datos)).rejects.toThrow()
    expect(http).not.toHaveBeenCalled()
  })
  it('acepta ocho caracteres y conserva espacios significativos', async () => {
    const datos = { passwordActual: ' anterior ', passwordNueva: '        ' }
    await cambiarContrasenaCuenta(datos)
    expect(JSON.parse(patches()[0][1].body)).toEqual(datos)
  })
  it.each([null, {}, [], { mensaje: 'ok' }, { mensaje: valores.passwordNueva }])('rechaza confirmación malformada sin reflejar contenido: %#', async dato => {
    http.mockResolvedValueOnce(respuesta(dato))
    await expect(cambiarContrasenaCuenta(valores)).rejects.toThrow('El servidor no confirmó')
  })
})

describe.each(['CLIENTE', 'PRESTADOR'])('Cambio desde cuenta %s', rol => {
  beforeEach(() => { cuenta.rol = rol })
  it('confirma éxito, limpia campos y conserva sesión y todos los datos de perfil', async () => {
    montar(); await abrir(); completar()
    const campos = [...document.querySelectorAll('input[type=password]')]
    enviar()
    expect(await screen.findByText('Contraseña actualizada.')).toBeVisible()
    expect(campos.every(campo => campo.value === '')).toBe(true)
    expect(auth.usuario).toMatchObject({ ...usuario, rol })
    expect(obtenerToken()).toBe(token)
    expect(patches()).toHaveLength(1)
    expect(screen.getByText('El cambio de contraseña no cierra otras sesiones abiertas.')).toBeVisible()
    await abrir()
    expect(screen.getByLabelText('Contraseña actual')).toHaveValue('')
    expect(screen.getByLabelText('Contraseña nueva')).toHaveValue('')
    expect(screen.getByLabelText('Confirmar contraseña nueva')).toHaveValue('')
  })
  it.each([
    [{ ...valores, passwordActual: '' }, valores.passwordNueva, /Ingresá/],
    [{ ...valores, passwordNueva: '' }, '', /Ingresá/],
    [{ ...valores, passwordNueva: 'corta' }, 'corta', /al menos 8/],
    [{ ...valores, passwordNueva: valores.passwordActual }, valores.passwordActual, /distinta/],
    [valores, 'Otra confirmación', /no coincide/],
    [valores, '', /Confirmá/],
  ])('valida campos sin petición ni cambios de sesión: %#', async (datos, confirmacion, error) => {
    montar(); await abrir(); completar(datos, confirmacion); enviar()
    expect(screen.getByRole('alert')).toHaveTextContent(error)
    expect(patches()).toHaveLength(0)
    expect(obtenerToken()).toBe(token)
  })
  it.each([400, 403, 409, 500, 404])('maneja HTTP %s sin éxito ni exposición del cuerpo y permite reintentar', async status => {
    const handler = http.getMockImplementation()
    let rechazar = true
    http.mockImplementation((url, opciones) => opciones.method === 'PATCH' && rechazar
      ? respuesta({ error: `Contraseña actual incorrecta: ${valores.passwordActual} ${valores.passwordNueva}` }, status) : handler(url, opciones))
    montar(); await abrir(); completar(); enviar()
    const alerta = await screen.findByRole('alert')
    expect(alerta).not.toHaveTextContent(valores.passwordActual)
    expect(alerta).not.toHaveTextContent(valores.passwordNueva)
    if (status === 400) expect(alerta).toHaveTextContent('contraseña actual: debe ser correcta')
    expect(screen.queryByText('Contraseña actualizada.')).toBeNull()
    expect(auth.usuario.nombre).toBe(usuario.nombre)
    expect(obtenerToken()).toBe(token)
    rechazar = false; enviar()
    expect(await screen.findByText('Contraseña actualizada.')).toBeVisible()
  })
  it('no confirma una respuesta exitosa malformada', async () => {
    const handler = http.getMockImplementation()
    http.mockImplementation((url, opciones) => opciones.method === 'PATCH' ? respuesta({ mensaje: 'no confirmado' }) : handler(url, opciones))
    montar(); await abrir(); completar(); enviar()
    expect(await screen.findByRole('alert')).toHaveTextContent('El servidor no confirmó')
    expect(screen.queryByText('Contraseña actualizada.')).toBeNull()
  })
  it('maneja error de red sin exponer contraseñas', async () => {
    const handler = http.getMockImplementation()
    http.mockImplementation((url, opciones) => opciones.method === 'PATCH' ? Promise.reject(new Error(valores.passwordActual)) : handler(url, opciones))
    montar(); await abrir(); completar(); enviar()
    expect(await screen.findByRole('alert')).toHaveTextContent('Revisá la conexión')
    expect(document.body.textContent).not.toContain(valores.passwordActual)
  })
  it('expira la sesión ante HTTP 401 y limpia los campos', async () => {
    const handler = http.getMockImplementation()
    http.mockImplementation((url, opciones) => opciones.method === 'PATCH' ? respuesta({ error: 'Expirada' }, 401) : handler(url, opciones))
    montar(); await abrir(); completar()
    const campos = [...document.querySelectorAll('input')]
    enviar()
    expect(await screen.findByText('Sin sesión de prueba')).toBeVisible()
    expect(obtenerToken()).toBeNull()
    expect(campos.every(campo => campo.value === '')).toBe(true)
    expect(screen.queryByText('Contraseña actualizada.')).toBeNull()
  })
  it('bloquea envíos duplicados sin confirmar antes de recibir respuesta', async () => {
    let resolver
    const handler = http.getMockImplementation()
    http.mockImplementation((url, opciones) => opciones.method === 'PATCH' ? new Promise(resolve => { resolver = resolve }) : handler(url, opciones))
    montar(); await abrir(); completar(); enviar(); enviar()
    expect(patches()).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled()
    expect(screen.getByRole('form')).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText('Contraseña actualizada.')).toBeNull()
    await act(async () => resolver(respuesta(exito)))
    expect(screen.getByText('Contraseña actualizada.')).toBeVisible()
  })
  it('enmascara los campos, permite autocompletar y limpia al cancelar o abandonar', async () => {
    const vista = montar(); await abrir(); completar()
    const actual = screen.getByLabelText('Contraseña actual')
    expect(actual).toHaveFocus()
    expect(actual).toHaveAttribute('type', 'password')
    expect(actual).toHaveAttribute('autocomplete', 'current-password')
    expect(actual).toBeRequired()
    for (const etiqueta of ['Contraseña nueva', 'Confirmar contraseña nueva']) {
      expect(screen.getByLabelText(etiqueta)).toHaveAttribute('type', 'password')
      expect(screen.getByLabelText(etiqueta)).toHaveAttribute('autocomplete', 'new-password')
      expect(screen.getByLabelText(etiqueta)).toHaveAccessibleDescription(/al menos 8/)
    }
    const campos = [...document.querySelectorAll('input')]
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(campos.every(campo => campo.value === '')).toBe(true)
    expect(patches()).toHaveLength(0)
    await abrir(); completar()
    const nueva = screen.getByLabelText('Contraseña nueva')
    vista.unmount()
    expect(nueva.value).toBe('')
  })
  it('no persiste ni imprime contraseñas, ni las incorpora a URL o texto visible', async () => {
    const local = vi.spyOn(Storage.prototype, 'setItem')
    const consola = ['log', 'error', 'warn', 'info', 'debug'].map(metodo => vi.spyOn(console, metodo))
    montar(); await abrir(); completar(); enviar()
    await screen.findByText('Contraseña actualizada.')
    expect(local).not.toHaveBeenCalled()
    expect(consola.every(espia => espia.mock.calls.length === 0)).toBe(true)
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(1)
    expect(document.body.textContent).not.toContain(valores.passwordNueva)
    expect(location.href).not.toContain(encodeURIComponent(valores.passwordNueva))
    expect(patches()[0][0]).not.toContain('?')
    local.mockRestore(); consola.forEach(espia => espia.mockRestore())
  })
  it.each([200, 401, 500])('ignora respuesta %s tras cambiar usuario sin afectar la sesión nueva', async status => {
    let resolver
    const handler = http.getMockImplementation()
    http.mockImplementation((url, opciones) => opciones.method === 'PATCH' ? new Promise(resolve => { resolver = resolve }) : handler(url, opciones))
    montar(); await abrir(); completar(); enviar()
    const campo = screen.getByLabelText('Contraseña actual')
    await waitFor(() => expect(resolver).toBeTypeOf('function'))
    cuenta = { ...cuenta, id: 'u2', nombre: 'Otra persona' }; token = jwtPrueba(Date.now() / 1000 + 7200)
    await act(async () => { await auth.logout(); await auth.login(cuenta.email, 'ficticia') })
    await act(async () => resolver(respuesta(status === 200 ? exito : { error: 'Sesión anterior' }, status)))
    expect(auth.usuario.id).toBe('u2')
    expect(obtenerToken()).toBe(token)
    expect(campo.value).toBe('')
    expect(screen.queryByText('Contraseña actualizada.')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByRole('form')).toBeNull()
  })
  it('descarta éxito después de expirar el token durante la petición', async () => {
    let resolver
    const handler = http.getMockImplementation()
    http.mockImplementation((url, opciones) => opciones.method === 'PATCH' ? new Promise(resolve => { resolver = resolve }) : handler(url, opciones))
    montar(); await abrir(); completar(); enviar()
    act(() => eliminarToken(true))
    await act(async () => resolver(respuesta(exito)))
    expect(auth.usuario).toBeNull()
    expect(auth.sesionExpirada).toBe(true)
    expect(screen.queryByText('Contraseña actualizada.')).toBeNull()
  })
})

it('no ofrece cambio de contraseña sin proveedor autenticado', () => {
  render(<CambioContrasena />)
  expect(screen.queryByRole('button', { name: 'Cambiar contraseña' })).toBeNull()
})
