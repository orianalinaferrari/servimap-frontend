import { describe, expect, test } from 'vitest'
import {
  OFICIOS_PERMITIDOS,
  normalizarOficio,
  obtenerOficiosValidos,
  validarOficios,
} from '../utils/oficiosPrestador'

describe('F-06 Gestión de oficios del prestador', () => {
  test('dispone del catálogo provisional de oficios', () => {
    expect(OFICIOS_PERMITIDOS).toContain('Plomero')
    expect(OFICIOS_PERMITIDOS).toContain('Electricista')
    expect(OFICIOS_PERMITIDOS).toContain('Gasista')
  })

  test('normaliza oficios equivalentes', () => {
    expect(normalizarOficio('Plomería')).toBe('Plomero')
    expect(normalizarOficio('electricidad')).toBe('Electricista')
  })

  test('rechaza oficios fuera del catálogo', () => {
    expect(normalizarOficio('Oficio inexistente')).toBeNull()
    expect(validarOficios(['Oficio inexistente']))
      .toBe('Hay oficios que no están permitidos')
  })

  test('elimina duplicados al obtener oficios válidos', () => {
    expect(
      obtenerOficiosValidos('Plomero, Plomería, Gasista')
    ).toEqual(['Plomero', 'Gasista'])
  })

  test('requiere al menos un oficio', () => {
    expect(validarOficios([]))
      .toBe('Seleccioná al menos un oficio')
  })

  test('detecta oficios duplicados', () => {
    expect(validarOficios(['Plomero', 'Plomería']))
      .toBe('No se permiten oficios duplicados')
  })

  test('acepta varios oficios permitidos', () => {
    expect(validarOficios(['Plomero', 'Gasista'])).toBeNull()
  })
})
