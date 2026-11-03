import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { DistanciaPrestador } from '../components/DistanciaPrestador'
import FichaPrestadorRemota from '../components/FichaPrestadorRemota'
import { BASE, respuesta } from './helpers/contratos'

afterEach(() => { cleanup(); vi.unstubAllEnvs() })
describe('Texto de distancia accesible', () => {
  it('no presenta una cifra sin referencia, se actualiza y desaparece al limpiar', () => {
    const prestador = { latitud: 0, longitud: 1 }
    const vista = render(<DistanciaPrestador prestador={prestador} />)
    expect(screen.queryByText(/Distancia/)).not.toBeInTheDocument()
    vista.rerender(<DistanciaPrestador prestador={prestador} referencia={{ latitud: 0, longitud: 0 }} />)
    expect(screen.getByText(/111,2 km en línea recta \(no por calles\)/)).toBeVisible()
    vista.rerender(<DistanciaPrestador prestador={prestador} referencia={{ latitud: 0, longitud: 1 }} />)
    expect(screen.getByText(/0,0 km/)).toBeVisible()
    vista.rerender(<DistanciaPrestador prestador={prestador} referencia={null} />)
    expect(screen.queryByText(/Distancia/)).not.toBeInTheDocument()
  })
  it('muestra un mensaje discreto sin coordenadas públicas', () => {
    render(<DistanciaPrestador prestador={{ nombre: 'Sin ubicación' }} referencia={{ latitud: 0, longitud: 0 }} />)
    expect(screen.getByText('Distancia no disponible')).toBeVisible()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('recupera un error de ficha y recalcula al cambiar referencia sin consultar otra vez la API', async () => {
    vi.stubEnv('VITE_API_URL', BASE)
    const publico = { id: 'p1', nombre: 'Ficha pública de prueba', oficios: [], latitud: 0, longitud: 1, disponible: true, precioMin: null, precioMax: null, reputacion: { promedio: null }, comentarios: [] }
    const http = vi.fn().mockResolvedValueOnce(respuesta({ error: 'Ficha temporalmente no disponible' }, 500)).mockResolvedValue(respuesta(publico))
    vi.stubGlobal('fetch', http)
    const volver = vi.fn()
    const vista = render(<FichaPrestadorRemota id="p1" referencia={{ latitud: 0, longitud: 0 }} onVolver={volver} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Ficha temporalmente no disponible')
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar ficha' }))
    expect(await screen.findByText(/111,2 km/)).toBeVisible()
    vista.rerender(<FichaPrestadorRemota id="p1" referencia={{ latitud: 0, longitud: 1 }} onVolver={volver} />)
    expect(screen.getByText(/0,0 km/)).toBeVisible()
    vista.rerender(<FichaPrestadorRemota id="p1" referencia={null} onVolver={volver} />)
    expect(screen.queryByText(/Distancia/)).not.toBeInTheDocument()
    expect(http).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }))
    expect(volver).toHaveBeenCalledTimes(1)
  })
})
