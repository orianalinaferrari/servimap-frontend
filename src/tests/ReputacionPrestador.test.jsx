import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import { ReputacionPrestador } from '../components/ReputacionPrestador'
import { calificacionesMock } from '../data/calificacionesMock'
import { prestadoresMock } from '../data/prestadoresMock'
import { generarEstrellas, obtenerCalificacionesVisibles } from '../utils/reputacion'

afterEach(cleanup)

describe('funciones de reputación', () => {
  test('genera estrellas redondeando el promedio', () => {
    expect(generarEstrellas(4.1)).toBe('★★★★☆')
    expect(generarEstrellas(4.5)).toBe('★★★★★')
  })

  test('no incluye calificaciones moderadas', () => {
    const visibles = obtenerCalificacionesVisibles(calificacionesMock, 3)
    expect(visibles).toHaveLength(1)
  })
})

describe('ReputacionPrestador', () => {
  test('muestra los comentarios del prestador', () => {
    const carlos = prestadoresMock[0]
    render(<ReputacionPrestador prestador={carlos} calificaciones={calificacionesMock} />)

    expect(screen.getByText(/Muy puntual y prolijo/)).toBeTruthy()
    expect(screen.getByText(/Buen trabajo/)).toBeTruthy()
  })

  test('muestra mensaje si no hay comentarios', () => {
    const javier = prestadoresMock[6]
    render(<ReputacionPrestador prestador={javier} calificaciones={calificacionesMock} />)

    expect(screen.getByText('Sin calificaciones')).toBeTruthy()
    expect(screen.getByText('Todavía no hay comentarios')).toBeTruthy()
  })
})
