import { describe, expect, test } from 'vitest'
import {
  FILTROS_INICIALES,
  obtenerOpcionesFiltros,
  aplicarFiltrosPrestadores,
  construirParametrosFiltros,
} from '../utils/filtrosPrestadores'
import { prestadoresMock } from '../data/prestadoresMock'

describe('F-08 - Filtros de prestadores', () => {
  test('sin filtros devuelve todos', () => {
    expect(aplicarFiltrosPrestadores(prestadoresMock)).toHaveLength(7)
  })

  test('filtra por oficio', () => {
    expect(
      aplicarFiltrosPrestadores(prestadoresMock, '', { oficio: 'Plomero' })
    ).toHaveLength(2)
  })

  test('filtra por zona', () => {
    expect(
      aplicarFiltrosPrestadores(prestadoresMock, '', { zona: 'Palermo' })
    ).toHaveLength(1)
  })

  test('filtra por precio máximo', () => {
    expect(
      aplicarFiltrosPrestadores(prestadoresMock, '', { precioMaximo: '15000' })
    ).toHaveLength(3)
  })

  test('filtra por calificación mínima', () => {
    expect(
      aplicarFiltrosPrestadores(prestadoresMock, '', { calificacionMinima: '4.5' })
    ).toHaveLength(3)
  })

  test('excluye prestadores sin calificación cuando se solicita una mínima', () => {
    const resultados = aplicarFiltrosPrestadores(
      prestadoresMock,
      '',
      { calificacionMinima: '4' }
    )

    expect(resultados.some((prestador) => prestador.id === 7)).toBe(false)
  })

  test('filtra por disponibilidad', () => {
    expect(
      aplicarFiltrosPrestadores(prestadoresMock, '', { soloDisponibles: true })
    ).toHaveLength(6)
  })

  test('combina búsqueda y filtros', () => {
    const resultados = aplicarFiltrosPrestadores(
      prestadoresMock,
      'plom',
      { soloDisponibles: true }
    )

    expect(resultados).toHaveLength(1)
    expect(resultados[0].id).toBe(1)
  })

  test('combina varios criterios', () => {
    const resultados = aplicarFiltrosPrestadores(
      prestadoresMock,
      '',
      {
        oficio: 'Plomero',
        precioMaximo: '16000',
        calificacionMinima: '4.5',
        soloDisponibles: true,
      }
    )

    expect(resultados).toHaveLength(1)
    expect(resultados[0].id).toBe(1)
  })

  test('obtiene opciones únicas de oficios y zonas', () => {
    const opciones = obtenerOpcionesFiltros(prestadoresMock)

    expect(opciones.oficios).toContain('Plomero')
    expect(opciones.zonas).toContain('Palermo')
    expect(new Set(opciones.oficios).size).toBe(opciones.oficios.length)
  })

  test('construye parámetros para solicitudes al backend', () => {
    const parametros = construirParametrosFiltros('plom', {
      oficio: 'Plomero',
      calificacionMinima: '4',
      soloDisponibles: true,
    })

    expect(parametros.get('q')).toBe('plom')
    expect(parametros.get('oficio')).toBe('Plomero')
    expect(parametros.get('calificacionMin')).toBe('4')
    expect(parametros.get('disponible')).toBe('true')
  })

  test('los filtros iniciales no restringen resultados', () => {
    expect(
      aplicarFiltrosPrestadores(prestadoresMock, '', FILTROS_INICIALES)
    ).toHaveLength(7)
  })
})
