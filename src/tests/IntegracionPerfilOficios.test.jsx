import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PerfilPrestador from '../pages/PerfilPrestador'
import OficiosPrestador from '../pages/OficiosPrestador'
import { BASE, instalarHttp, respuesta, perfilPrueba } from './helpers/contratos'
beforeEach(() => vi.stubEnv('VITE_API_URL', BASE))
afterEach(() => { cleanup(); vi.unstubAllEnvs() })
it('editar perfil no reemplaza los oficios guardados remotamente', async () => {
  let perfil = { ...perfilPrueba }
  const http = instalarHttp((url, config) => {
    if (url.pathname === '/api/oficios') return respuesta([{ id: 'o1', nombre: 'Plomero' }, { id: 'o2', nombre: 'Electricista' }])
    if (url.pathname.endsWith('/calificaciones')) return respuesta([])
    if (config.method === 'PUT') perfil = { ...perfil, ...JSON.parse(config.body) }
    return respuesta(perfil)
  })
  render(<MemoryRouter><Routes><Route path="/" element={<PerfilPrestador />} /><Route path="/prestador/oficios" element={<OficiosPrestador />} /></Routes></MemoryRouter>)
  fireEvent.click(await screen.findByRole('button', { name: 'Editar perfil' }))
  fireEvent.change(screen.getByLabelText('Descripción profesional'), { target: { value: 'Actualización remota' } })
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
  await screen.findByText('Perfil actualizado en el servidor.')
  fireEvent.click(screen.getByRole('link', { name: 'Administrar mis oficios' }))
  await screen.findByRole('button', { name: 'Quitar Plomero' })
  expect(JSON.parse(http.mock.calls.find(([, c]) => c.method === 'PUT')[1].body).oficios).toBeUndefined()
})
