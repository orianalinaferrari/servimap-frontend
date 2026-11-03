import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom/vitest'
import PerfilPrestador from '../pages/PerfilPrestador'
import { BASE, instalarHttp, respuesta, perfilPrueba } from './helpers/contratos'
let http
beforeEach(() => {
  vi.stubEnv('VITE_API_URL', BASE)
  http = instalarHttp((url, config) => url.pathname.endsWith('/calificaciones') ? respuesta([]) : respuesta({ ...perfilPrueba, ...(config.body ? JSON.parse(config.body) : {}) }))
})
afterEach(() => { cleanup(); vi.unstubAllEnvs() })
async function mostrar() { render(<MemoryRouter><PerfilPrestador /></MemoryRouter>); await screen.findByRole('heading', { name: 'Mi perfil' }) }
describe('Perfil remoto del prestador', () => {
  it('quita la foto por URL solo después de guardar y permite cancelar esa intención', async () => {
    const anterior = 'https://imagenes.example.test/anterior.jpg'
    const original = http.getMockImplementation()
    http.mockImplementation((url, config) => config.method === 'PUT' || new URL(url).pathname.endsWith('/calificaciones') ? original(url, config) : respuesta({ ...perfilPrueba, fotoPerfil: anterior }))
    await mostrar(); fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }))
    fireEvent.click(screen.getByRole('button', { name: 'Quitar foto' }))
    expect(screen.getByLabelText('URL de foto de perfil')).toHaveValue('')
    expect(document.querySelector('.prestador-avatar img')).toHaveAttribute('src', anterior)
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(document.querySelector('.prestador-avatar img')).toHaveAttribute('src', anterior)
    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }))
    fireEvent.click(screen.getByRole('button', { name: 'Quitar foto' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await screen.findByText('Perfil actualizado en el servidor.')
    expect(JSON.parse(http.mock.calls.find(([, c]) => c.method === 'PUT')[1].body).fotoPerfil).toBe('')
    expect(document.querySelector('.prestador-avatar img')).toBeNull()
  })
  it('conserva títulos y tarjetas al editar en el mismo lugar, con acciones al final', async () => {
    await mostrar()
    const titulos = screen.getAllByRole('heading').map((e) => e.textContent)
    const boton = screen.getByRole('button', { name: 'Editar perfil' })
    expect(document.querySelector('.prestador-identidad button')).toBeNull()
    expect(document.querySelector('.prestador-dos-columnas').compareDocumentPosition(boton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    fireEvent.click(boton)
    expect(screen.getAllByRole('heading').map((e) => e.textContent)).toEqual(titulos)
    expect(screen.getByLabelText('Teléfono').closest('.prestador-tarjeta')).toHaveTextContent('Información de contacto')
    expect(screen.getByLabelText('Zona de cobertura').closest('.prestador-tarjeta')).toHaveTextContent('Información del servicio')
    expect(screen.getByRole('heading', { name: 'Calificaciones recibidas' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Nombre y apellido')).toBeNull()
    expect(screen.queryByLabelText('Cambiar foto')).toBeNull()
  })
  it('descarta los cambios al cancelar y restaura los valores en la próxima edición', async () => {
    await mostrar(); fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }))
    fireEvent.change(screen.getByLabelText('Zona de cobertura'), { target: { value: 'Cambio cancelado' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByText('Cambio cancelado')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }))
    expect(screen.getByLabelText('Zona de cobertura')).toHaveValue(perfilPrueba.zonaCobertura)
    expect(http.mock.calls.some(([, config]) => config.method === 'PUT')).toBe(false)
  })
  it('mantiene datos ingresados tras error de guardado y permite corregirlos', async () => {
    await mostrar(); fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }))
    fireEvent.change(screen.getByLabelText('Descripción profesional'), { target: { value: 'Descripción sin guardar' } })
    http.mockResolvedValueOnce(respuesta({ error: 'Sin conexión al servidor' }, 500))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión al servidor')
    expect(screen.getByLabelText('Descripción profesional')).toHaveValue('Descripción sin guardar')
    expect(screen.queryByText('Perfil actualizado en el servidor.')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Perfil actualizado en el servidor.')).toBeInTheDocument()
    expect(screen.getByText('Descripción sin guardar')).toBeInTheDocument()
  })
  it('rechaza una respuesta sin el perfil propio confirmado', async () => {
    await mostrar(); fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }))
    http.mockResolvedValueOnce(respuesta({ ...perfilPrueba, id: 'otra-cuenta' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('El servidor no confirmó un perfil válido')
    expect(screen.getByLabelText('Zona de cobertura')).toBeInTheDocument()
    expect(screen.queryByText('Perfil actualizado en el servidor.')).toBeNull()
  })
  it('consulta el perfil privado del dueño y sus comentarios', async () => { await mostrar(); expect(http.mock.calls.map(([url]) => new URL(url).pathname)).toEqual(['/api/prestadores/me','/api/prestadores/me/calificaciones']) })
  it('abre un formulario con campos admitidos por el contrato', async () => { await mostrar(); fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' })); expect(screen.getByLabelText('Latitud privada')).toHaveValue(-34.123456); expect(screen.queryByLabelText('Apellido')).toBeNull() })
  it('guarda descripción mediante PUT sin tocar nombre, email, DNI u oficios', async () => {
    await mostrar(); fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' })); fireEvent.change(screen.getByLabelText('Descripción profesional'), { target: { value: 'Nueva descripción' } }); fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Perfil actualizado en el servidor.')).toBeInTheDocument()
    const [url, config] = http.mock.calls.find(([, config]) => config.method === 'PUT')
    expect(url).toBe(BASE + '/api/prestadores/me'); expect(JSON.parse(config.body)).toMatchObject({ descripcionProfesional: 'Nueva descripción', disponible: true })
    for (const campo of ['nombre','email','dni','oficios','oficioIds']) expect(JSON.parse(config.body)).not.toHaveProperty(campo)
  })
  it('cancela cambios sin escribir en el servidor', async () => { await mostrar(); fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' })); fireEvent.click(screen.getByRole('button', { name: 'Cancelar' })); expect(http.mock.calls.some(([, config]) => config.method === 'PUT')).toBe(false) })
  it('mantiene el formulario y muestra el rechazo del servidor', async () => {
    await mostrar(); http.mockResolvedValueOnce(respuesta({ error: 'Precio mínimo mayor al máximo' },400)); fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' })); fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' })); expect(await screen.findByRole('alert')).toHaveTextContent('Precio mínimo')
  })
  it('rechaza coordenadas fuera de rango antes de enviar', async () => {
    await mostrar(); fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' })); fireEvent.change(screen.getByLabelText('Latitud privada'), { target: { value: '100' } }); fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' })); expect(await screen.findByRole('alert')).toHaveTextContent('coordenadas'); expect(http.mock.calls.some(([, config]) => config.method === 'PUT')).toBe(false)
  })
  it('muestra error de consulta con reintento', async () => { http.mockResolvedValueOnce(respuesta({ error: 'Perfil no encontrado' },404)); render(<MemoryRouter><PerfilPrestador /></MemoryRouter>); expect(await screen.findByText('Perfil no encontrado')).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: 'Reintentar perfil' })); await waitFor(() => expect(screen.getByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument()) })
})
