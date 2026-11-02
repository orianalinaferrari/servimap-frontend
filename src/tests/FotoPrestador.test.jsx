import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom/vitest'
import FichaPrestadorRemota from '../components/FichaPrestadorRemota'
import PerfilPrestador from '../pages/PerfilPrestador'
import { BuscadorPrestadores } from '../components/BuscadorPrestadores'
import { listarPrestadores } from '../services/prestadoresService'
import { BASE, instalarHttp, perfilPrueba, respuesta } from './helpers/contratos'

vi.mock('../components/mapa/MapaPrestadores', () => ({ MapaPrestadores: () => null }))
const foto = 'https://imagenes.example.test/prestador-p1.jpg'
let perfil
let http
beforeEach(() => {
  vi.stubEnv('VITE_API_URL', BASE)
  perfil = { ...perfilPrueba, fotoPerfil: foto }
  http = instalarHttp((url, config) => {
    if (url.pathname.endsWith('/calificaciones')) return respuesta([])
    if (config.method === 'PUT') perfil = { ...perfil, ...JSON.parse(config.body) }
    return respuesta(url.pathname === '/api/prestadores' ? [perfil] : perfil)
  })
})
afterEach(() => { cleanup(); vi.unstubAllEnvs() })

describe.each(['ficha pública', 'perfil autenticado'])('Foto en %s desde HTTP', (vista) => {
  async function mostrar() {
    const resultado = render(<MemoryRouter>{vista === 'ficha pública'
      ? <FichaPrestadorRemota id="p1" onVolver={() => {}} />
      : <PerfilPrestador />}</MemoryRouter>)
    await screen.findByRole('heading', { name: perfil.nombre })
    return resultado
  }
  it('muestra la URL recibida para ese prestador', async () => {
    const { container } = await mostrar()
    expect(container.querySelector('img')).toHaveAttribute('src', foto)
    expect(new URL(http.mock.calls[0][0]).pathname).toBe(vista === 'ficha pública' ? '/api/prestadores/p1' : '/api/prestadores/me')
  })
  it.each([null, '', undefined, '/uploads/p1.jpg'])('con foto %s conserva iniciales sin asumir un origen', async (valor) => {
    perfil.fotoPerfil = valor
    const { container } = await mostrar()
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('NP')
  })
  it('reemplaza una imagen fallida por las iniciales', async () => {
    const { container } = await mostrar()
    fireEvent.error(container.querySelector('img'))
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('NP')
    expect(screen.getByRole('button', { name: vista === 'ficha pública' ? 'Solicitar servicio' : 'Editar perfil' })).toBeEnabled()
  })
})

it('conserva fotoPerfil al adaptar listado y usa el ícono de respaldo en sus tarjetas', async () => {
  const lista = await listarPrestadores()
  expect(lista[0].fotoPerfil).toBe(foto)
  const { container, rerender } = render(<BuscadorPrestadores prestadores={lista} />)
  fireEvent.error(container.querySelector('img'))
  expect(container.querySelector('.directorio-avatar svg')).not.toBeNull()
  const otro = { ...lista[0], id: 'p2', nombre: 'Otro Prestador', fotoPerfil: 'https://imagenes.example.test/p2.jpg' }
  rerender(<BuscadorPrestadores prestadores={[otro]} />)
  expect(container.querySelector('img')).toHaveAttribute('src', otro.fotoPerfil)
  rerender(<BuscadorPrestadores prestadores={[{ ...otro, fotoPerfil: null }]} />)
  expect(container.querySelector('img')).toBeNull()
  expect(container.querySelector('.directorio-avatar svg')).not.toBeNull()
})

it('conserva la foto persistida al guardar otros datos sin enviar URLs temporales', async () => {
  const { container } = render(<MemoryRouter><PerfilPrestador /></MemoryRouter>)
  fireEvent.click(await screen.findByRole('button', { name: 'Editar perfil' }))
  expect(screen.getByLabelText('URL de foto de perfil')).toHaveValue(foto)
  expect(screen.getByText('Pegá el enlace público de una imagen para usarla como foto de perfil')).toBeInTheDocument()
  expect(container.querySelector('input[type="file"]')).toBeNull()
  fireEvent.change(screen.getByLabelText('Descripción profesional'), { target: { value: 'Descripción actualizada' } })
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
  await screen.findByText('Perfil actualizado en el servidor.')
  expect(container.querySelector('img')).toHaveAttribute('src', foto)
  expect(JSON.parse(http.mock.calls.find(([, config]) => config.method === 'PUT')[1].body).fotoPerfil).toBe(foto)
})

it.each(['https://imagenes.example.test/nueva.webp', 'http://imagenes.example.test/nueva.png', ''])('guarda la URL %j y la recupera al volver a abrir el perfil', async (url) => {
  const vista = render(<MemoryRouter><PerfilPrestador /></MemoryRouter>)
  fireEvent.click(await screen.findByRole('button', { name: 'Editar perfil' }))
  fireEvent.change(screen.getByLabelText('URL de foto de perfil'), { target: { value: url ? `  ${url}  ` : '' } })
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
  await screen.findByText('Perfil actualizado en el servidor.')
  expect(JSON.parse(http.mock.calls.find(([, config]) => config.method === 'PUT')[1].body).fotoPerfil).toBe(url)
  vista.unmount()
  const nuevaVista = render(<MemoryRouter><PerfilPrestador /></MemoryRouter>)
  await screen.findByRole('heading', { name: perfil.nombre })
  if (url) expect(nuevaVista.container.querySelector('img')).toHaveAttribute('src', url)
  else {
    expect(nuevaVista.container.querySelector('img')).toBeNull()
    expect(nuevaVista.container.querySelector('.prestador-avatar')).toHaveTextContent('NP')
  }
  nuevaVista.unmount()
  const lista = await listarPrestadores()
  expect(lista[0].fotoPerfil).toBe(url)
  const tarjetas = render(<BuscadorPrestadores prestadores={lista} />)
  if (url) expect(tarjetas.container.querySelector('img')).toHaveAttribute('src', url)
  else expect(tarjetas.container.querySelector('.directorio-avatar svg')).not.toBeNull()
  tarjetas.unmount()
  const ficha = render(<MemoryRouter><FichaPrestadorRemota id="p1" onVolver={() => {}} /></MemoryRouter>)
  await screen.findByRole('heading', { name: perfil.nombre })
  if (url) expect(ficha.container.querySelector('img')).toHaveAttribute('src', url)
  else expect(ficha.container.querySelector('.detalle-avatar')).toHaveTextContent('NP')
})

it('espera la confirmación del PUT antes de anunciar éxito y bloquea el formulario mientras guarda', async () => {
  render(<MemoryRouter><PerfilPrestador /></MemoryRouter>)
  fireEvent.click(await screen.findByRole('button', { name: 'Editar perfil' }))
  const nueva = 'https://imagenes.example.test/nueva.jpg'
  fireEvent.change(screen.getByLabelText('URL de foto de perfil'), { target: { value: nueva } })
  let confirmar
  http.mockImplementationOnce(() => new Promise((resolve) => { confirmar = resolve }))
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
  expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled()
  expect(screen.getByLabelText('URL de foto de perfil')).toBeDisabled()
  expect(screen.queryByText('Perfil actualizado en el servidor.')).toBeNull()
  await act(async () => { confirmar(respuesta({ ...perfil, fotoPerfil: nueva })) })
  expect(screen.getByText('Perfil actualizado en el servidor.')).toBeInTheDocument()
})

it.each(['foto.jpg', '/uploads/foto.jpg', '//imagenes.example.test/foto.jpg', 'https://', 'https:foto.jpg', 'ftp://imagenes.example.test/foto.jpg', 'data:image/png;base64,AAAA', 'blob:https://example.test/id', 'javascript:alert(1)', 'https://usuario:clave@imagenes.example.test/foto.jpg'])('rechaza %j sin enviar el perfil', async (url) => {
  render(<MemoryRouter><PerfilPrestador /></MemoryRouter>)
  fireEvent.click(await screen.findByRole('button', { name: 'Editar perfil' }))
  fireEvent.change(screen.getByLabelText('URL de foto de perfil'), { target: { value: url } })
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('URL pública HTTP o HTTPS')
  expect(http.mock.calls.some(([, config]) => config.method === 'PUT')).toBe(false)
  expect(screen.queryByText('Perfil actualizado en el servidor.')).toBeNull()
})

it.each([400, 401, 500])('conserva el formulario y no confirma una URL rechazada con HTTP %s', async (status) => {
  render(<MemoryRouter><PerfilPrestador /></MemoryRouter>)
  fireEvent.click(await screen.findByRole('button', { name: 'Editar perfil' }))
  fireEvent.change(screen.getByLabelText('URL de foto de perfil'), { target: { value: 'https://imagenes.example.test/otra.jpg' } })
  http.mockResolvedValueOnce(respuesta({ error: 'Foto rechazada' }, status))
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Foto rechazada')
  expect(screen.queryByText('Perfil actualizado en el servidor.')).toBeNull()
  expect(screen.getByLabelText('URL de foto de perfil')).toHaveValue('https://imagenes.example.test/otra.jpg')
})
