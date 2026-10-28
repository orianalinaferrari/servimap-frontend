import { describe, expect, test } from 'vitest'
import {
  puedeCalificarSolicitud,
  solicitudYaCalificada,
  validarCalificacion,
} from '../utils/calificacionSolicitud'

describe('F-17 - Calificación de prestador', () => {
  const finalizada = {
    id: 12,
    estado: 'FINALIZADA',
  }

  test('permite calificar una solicitud finalizada', () => {
    expect(puedeCalificarSolicitud(finalizada)).toBe(true)
  })

  test('impide calificar una solicitud pendiente', () => {
    expect(
      puedeCalificarSolicitud({
        id: 12,
        estado: 'PENDIENTE',
      })
    ).toBe(false)
  })

  test('impide calificar una solicitud aceptada', () => {
    expect(
      puedeCalificarSolicitud({
        id: 12,
        estado: 'ACEPTADA',
      })
    ).toBe(false)
  })

  test('impide calificar sin identificador', () => {
    expect(
      puedeCalificarSolicitud({ estado: 'FINALIZADA' })
    ).toBe(false)
  })

  test('impide calificar dos veces', () => {
    expect(
      puedeCalificarSolicitud({
        ...finalizada,
        calificada: true,
      })
    ).toBe(false)
  })

  test('reconoce una calificación existente', () => {
    expect(
      solicitudYaCalificada({
        ...finalizada,
        calificacion: {
          puntaje: 5,
          comentario: 'Excelente',
        },
      })
    ).toBe(true)
  })

  test('acepta puntuación de 1 a 5', () => {
    for (let puntaje = 1; puntaje <= 5; puntaje++) {
      expect(
        validarCalificacion({ puntaje, comentario: '' }).puntaje
      ).toBe(puntaje)
    }
  })

  test('rechaza puntuación fuera de rango', () => {
    expect(() =>
      validarCalificacion({ puntaje: 0, comentario: '' })
    ).toThrow()

    expect(() =>
      validarCalificacion({ puntaje: 6, comentario: '' })
    ).toThrow()
  })

  test('rechaza puntuación decimal', () => {
    expect(() =>
      validarCalificacion({ puntaje: 3.5, comentario: '' })
    ).toThrow()
  })

  test('el comentario es opcional', () => {
    expect(
      validarCalificacion({ puntaje: 5, comentario: '' })
    ).toEqual({
      puntaje: 5,
      comentario: '',
    })
  })

  test('elimina espacios sobrantes del comentario', () => {
    expect(
      validarCalificacion({
        puntaje: 4,
        comentario: '  Muy buen servicio  ',
      }).comentario
    ).toBe('Muy buen servicio')
  })
})