import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import { BuscadorPrestadores } from '../components/BuscadorPrestadores'
import { prestadoresMock } from '../data/prestadoresMock'
afterEach(cleanup)

describe('BuscadorPrestadores', () => {
  test('muestra todos los prestadores al inicio', () => {
    render(<BuscadorPrestadores prestadores={prestadoresMock} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(7)
  })

  test('filtra al escribir en el buscador', () => {
    render(<BuscadorPrestadores prestadores={prestadoresMock} />)
    const input = screen.getByLabelText('Buscar prestador')

    fireEvent.change(input, { target: { value: 'plom' } })

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  test('muestra mensaje si no hay resultados', () => {
    render(<BuscadorPrestadores prestadores={prestadoresMock} />)
    const input = screen.getByLabelText('Buscar prestador')

    fireEvent.change(input, { target: { value: 'xyz' } })

    expect(screen.getByText(/No se encontraron prestadores/)).toBeTruthy()
  })
})