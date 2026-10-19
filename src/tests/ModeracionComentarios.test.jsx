import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import App from '../App'
import { calificacionesMock } from '../data/calificacionesMock'
import { moderarCalificacion } from '../utils/reputacion'

afterEach(cleanup)

describe('moderarCalificacion', () => {
  test('marca la calificación como moderada con motivo y fecha', () => {
    const resultado = moderarCalificacion(calificacionesMock, 1, 'Ofensivo', '2026-10-19')

    expect(resultado[0].moderada).toBe(true)
    expect(resultado[0].motivoModeracion).toBe('Ofensivo')
    expect(resultado[0].fechaModeracion).toBe('2026-10-19')
  })

  test('no modifica la lista original', () => {
    moderarCalificacion(calificacionesMock, 1, 'Ofensivo', '2026-10-19')

    expect(calificacionesMock[0].moderada).toBe(false)
  })
})

describe('Moderación de comentarios', () => {
  test('no permite confirmar sin motivo', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Administración' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar comentario de Ana Torres' }))

    expect(screen.getByRole('button', { name: 'Confirmar' }).disabled).toBe(true)
  })

  test('el comentario moderado deja de verse en el detalle del prestador', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Administración' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar comentario de Ana Torres' }))
    fireEvent.change(screen.getByLabelText('Motivo de la moderación'), {
      target: { value: 'Lenguaje inapropiado' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(screen.getByText('Motivo: Lenguaje inapropiado')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Buscar prestadores' }))
    fireEvent.click(screen.getByRole('button', { name: 'Carlos Gómez' }))

    expect(screen.queryByText(/Muy puntual y prolijo/)).toBeNull()
    expect(screen.getByText(/Buen trabajo/)).toBeTruthy()
  })
})
