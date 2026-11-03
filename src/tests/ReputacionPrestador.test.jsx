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
  test('oculta contenido, autor y estrellas de registros moderados y de otros prestadores', () => {
    const prestador = { id: 'p1', calificacionPromedio: 4, trabajosFinalizados: 7 }
    const datos = [
      { id: 'visible', prestadorId: 'p1', moderada: false, puntaje: 4, comentario: 'Reseña pública', clienteNombre: 'Cliente visible', fechaPublicacion: '2026-11-01' },
      { id: 'oculta', prestadorId: 'p1', moderada: true, puntaje: 1, comentario: 'Texto ocultado', clienteNombre: 'Autor ocultado', motivoModeracion: 'Motivo privado', fechaPublicacion: '2026-11-01' },
      { id: 'otro', prestadorId: 'p2', moderada: false, puntaje: 2, comentario: 'Otro prestador', fechaPublicacion: '2026-11-01' },
    ]
    render(<ReputacionPrestador prestador={prestador} calificaciones={datos} />)
    expect(screen.getByText('Reseña pública')).toBeTruthy()
    expect(screen.queryByText('Texto ocultado')).toBeNull()
    expect(screen.queryByText('Autor ocultado')).toBeNull()
    expect(screen.queryByText('Motivo privado')).toBeNull()
    expect(screen.queryByText('Otro prestador')).toBeNull()
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })

  test('deja de mostrar un comentario al recibirlo moderado sin recalcular el agregado del servidor', () => {
    const prestador = { id: 'p1', calificacionPromedio: 3.5, trabajosFinalizados: 7 }
    const datos = [{ id: 'c1', prestadorId: 'p1', moderada: false, puntaje: 5, comentario: 'Comentario que se ocultará', fechaPublicacion: '2026-11-01' }]
    const { rerender } = render(<ReputacionPrestador prestador={prestador} calificaciones={datos} />)
    expect(screen.getByText('Comentario que se ocultará')).toBeTruthy()
    rerender(<ReputacionPrestador prestador={prestador} calificaciones={[{ ...datos[0], moderada: true }]} />)
    expect(screen.queryByText('Comentario que se ocultará')).toBeNull()
    expect(screen.getByText('Todavía no hay comentarios')).toBeTruthy()
    // El agregado es un dato de API: esta prueba no afirma que backend lo haya corregido.
    expect(screen.getByText('Calificación: 3.5 / 5')).toBeTruthy()
    expect(screen.getByText('Trabajos finalizados: 7')).toBeTruthy()
  })

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
