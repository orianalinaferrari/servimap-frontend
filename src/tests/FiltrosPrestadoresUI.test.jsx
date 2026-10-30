import { afterEach, describe, expect, test } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { BuscadorPrestadores } from '../components/BuscadorPrestadores'
import { prestadoresMock } from '../data/prestadoresMock'

afterEach(cleanup)

function obtenerResultados() {
  const lista = screen.queryAllByRole('listitem')
  return lista
}

describe('F-08 - Interfaz de filtros', () => {
  test('muestra los controles de filtrado', () => {
    render(<BuscadorPrestadores prestadores={prestadoresMock} />)

    expect(screen.getByLabelText('Oficio')).toBeTruthy()
    expect(screen.getByLabelText('Zona')).toBeTruthy()
    expect(screen.getByLabelText('Precio máximo')).toBeTruthy()
    expect(screen.getByLabelText('Calificación mínima')).toBeTruthy()
    expect(screen.getByLabelText('Solo prestadores disponibles')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Limpiar filtros' })).toBeTruthy()
  })

  test('filtra por oficio desde el selector', () => {
    render(<BuscadorPrestadores prestadores={prestadoresMock} />)

    fireEvent.change(screen.getByLabelText('Oficio'), {
      target: { value: 'Plomero' },
    })

    expect(obtenerResultados()).toHaveLength(2)
  })

  test('filtra por zona desde el selector', () => {
    render(<BuscadorPrestadores prestadores={prestadoresMock} />)

    fireEvent.change(screen.getByLabelText('Zona'), {
      target: { value: 'Palermo' },
    })

    expect(obtenerResultados()).toHaveLength(1)
  })

  test('filtra por precio máximo', () => {
    render(<BuscadorPrestadores prestadores={prestadoresMock} />)

    fireEvent.change(screen.getByLabelText('Precio máximo'), {
      target: { value: '15000' },
    })

    expect(obtenerResultados()).toHaveLength(3)
  })

  test('filtra por calificación mínima', () => {
    render(<BuscadorPrestadores prestadores={prestadoresMock} />)

    fireEvent.change(screen.getByLabelText('Calificación mínima'), {
      target: { value: '4.5' },
    })

    expect(obtenerResultados()).toHaveLength(3)
  })

  test('filtra prestadores disponibles', () => {
    render(<BuscadorPrestadores prestadores={prestadoresMock} />)

    fireEvent.click(screen.getByLabelText('Solo prestadores disponibles'))

    expect(obtenerResultados()).toHaveLength(6)
  })

  test('combina varios filtros simultáneamente', () => {
    render(<BuscadorPrestadores prestadores={prestadoresMock} />)

    fireEvent.change(screen.getByLabelText('Oficio'), {
      target: { value: 'Plomero' },
    })

    fireEvent.click(screen.getByLabelText('Solo prestadores disponibles'))

    expect(obtenerResultados()).toHaveLength(1)
    expect(
      within(obtenerResultados()[0]).getByRole('button')
    ).toBeTruthy()
  })

  test('limpiar filtros restaura todos los resultados', () => {
    render(<BuscadorPrestadores prestadores={prestadoresMock} />)

    fireEvent.change(screen.getByLabelText('Oficio'), {
      target: { value: 'Plomero' },
    })

    fireEvent.change(screen.getByLabelText('Buscar prestador'), {
      target: { value: 'Carlos' },
    })

    expect(obtenerResultados()).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

    expect(obtenerResultados()).toHaveLength(7)
    expect(screen.getByLabelText('Oficio').value).toBe('')
    expect(screen.getByLabelText('Buscar prestador').value).toBe('')
  })

  test('muestra mensaje cuando no hay coincidencias', () => {
    render(<BuscadorPrestadores prestadores={prestadoresMock} />)

    fireEvent.change(screen.getByLabelText('Buscar prestador'), {
      target: { value: 'profesion-inexistente-123' },
    })

    expect(
      screen.getByText('No se encontraron prestadores con los criterios seleccionados.')
    ).toBeTruthy()
  })
})
