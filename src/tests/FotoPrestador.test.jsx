import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
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
  expect(screen.queryByLabelText('URL de foto de perfil')).toBeNull()
  fireEvent.change(screen.getByLabelText('Descripción profesional'), { target: { value: 'Descripción actualizada' } })
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
  await screen.findByText('Perfil actualizado en el servidor.')
  expect(container.querySelector('img')).toHaveAttribute('src', foto)
  expect(JSON.parse(http.mock.calls.find(([, config]) => config.method === 'PUT')[1].body)).not.toHaveProperty('fotoPerfil')
})
