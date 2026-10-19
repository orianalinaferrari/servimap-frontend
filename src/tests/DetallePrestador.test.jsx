import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import { BuscadorPrestadores } from '../components/BuscadorPrestadores'
import { prestadoresMock } from '../data/prestadoresMock'

afterEach(cleanup)

describe('Detalle del prestador', () => {
  test('muestra el detalle al hacer clic en un prestador', () => {
    render(<BuscadorPrestadores prestadores={prestadoresMock} />)

    fireEvent.click(screen.getByRole('button', { name: 'Carlos Gómez' }))

    expect(screen.getByText(/10 años de experiencia/)).toBeTruthy()
    expect(screen.getByText('Calificación: 4.5 / 5')).toBeTruthy()
  })

  test('muestra "Sin calificaciones" si no tiene calificaciones', () => {
    render(<BuscadorPrestadores prestadores={prestadoresMock} />)

    fireEvent.click(screen.getByRole('button', { name: 'Javier López' }))

    expect(screen.getByText('Sin calificaciones')).toBeTruthy()
  })

  test('muestra "No disponible" si el prestador no está disponible', () => {
    render(<BuscadorPrestadores prestadores={prestadoresMock} />)

    fireEvent.click(screen.getByRole('button', { name: 'Martín Rodríguez' }))

    expect(screen.getByText('No disponible')).toBeTruthy()
  })

  test('vuelve a la lista al hacer clic en Volver', () => {
    render(<BuscadorPrestadores prestadores={prestadoresMock} />)

    fireEvent.click(screen.getByRole('button', { name: 'Carlos Gómez' }))
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }))

    expect(screen.getAllByRole('listitem')).toHaveLength(7)
  })
})