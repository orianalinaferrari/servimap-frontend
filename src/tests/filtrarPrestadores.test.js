import { describe, expect, test } from 'vitest'
import { filtrarPrestadores, normalizar } from '../utils/filtrarPrestadores'
import { prestadoresMock } from '../data/prestadoresMock'

describe('normalizar', () => {
  test('quita mayúsculas y acentos', () => {
    expect(normalizar('Núñez')).toBe('nunez')
    expect(normalizar('CONSTITUCIÓN')).toBe('constitucion')
  })
})

describe('filtrarPrestadores', () => {
  test('devuelve todos si el término está vacío', () => {
    expect(filtrarPrestadores(prestadoresMock, '   ')).toHaveLength(7)
  })

  test('busca por oficio con coincidencia parcial', () => {
    const resultado = filtrarPrestadores(prestadoresMock, 'plom')
    expect(resultado).toHaveLength(2)
  })

  test('busca por nombre y zona sin acentos', () => {
    const resultado = filtrarPrestadores(prestadoresMock, 'nunez')
    expect(resultado).toHaveLength(2)
  })

  test('no distingue mayúsculas', () => {
    expect(filtrarPrestadores(prestadoresMock, 'PINT')).toHaveLength(2)
  })

  test('devuelve lista vacía si no hay coincidencias', () => {
    expect(filtrarPrestadores(prestadoresMock, 'xyz')).toHaveLength(0)
  })
})