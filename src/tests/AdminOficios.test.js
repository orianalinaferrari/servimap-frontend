import { describe, expect, test } from 'vitest'
import {
  crearCatalogoInicial,
  crearOficio,
  modificarOficio,
  cambiarEstadoOficio,
  validarNombreOficio,
} from '../utils/adminOficios'

describe('F-21 - Administración de oficios', () => {
  test('carga los siete oficios iniciales', () => {
    expect(crearCatalogoInicial()).toHaveLength(7)
  })

  test('crea un oficio activo', () => {
    const resultado = crearOficio(crearCatalogoInicial(), 'Albañil')

    expect(resultado).toHaveLength(8)
    expect(resultado[7].nombre).toBe('Albañil')
    expect(resultado[7].activo).toBe(true)
  })

  test('rechaza nombres vacíos', () => {
    expect(validarNombreOficio('', [])).toBeTruthy()
  })

  test('rechaza nombres duplicados', () => {
    expect(
      validarNombreOficio('plomero', crearCatalogoInicial())
    ).toBe('Ya existe un oficio con ese nombre.')
  })

  test('modifica un oficio', () => {
    const resultado = modificarOficio(
      crearCatalogoInicial(),
      1,
      'Plomería'
    )

    expect(resultado[0].nombre).toBe('Plomería')
  })

  test('desactiva un oficio', () => {
    const resultado = cambiarEstadoOficio(
      crearCatalogoInicial(),
      1,
      false
    )

    expect(resultado[0].activo).toBe(false)
  })

  test('reactiva un oficio', () => {
    const inicial = cambiarEstadoOficio(
      crearCatalogoInicial(),
      1,
      false
    )

    const resultado = cambiarEstadoOficio(inicial, 1, true)

    expect(resultado[0].activo).toBe(true)
  })

  test('no modifica el catálogo original', () => {
    const inicial = crearCatalogoInicial()

    crearOficio(inicial, 'Albañil')

    expect(inicial).toHaveLength(7)
  })
})
