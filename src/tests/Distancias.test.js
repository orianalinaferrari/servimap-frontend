import { describe, expect, it } from 'vitest'
import { calcularDistanciaKm, textoDistancia } from '../utils/distancias'

const cero = { latitud: 0, longitud: 0 }
const este = { latitud: 0, longitud: 1 }

describe('Distancias geográficas públicas', () => {
  it('calcula un grado de longitud sobre el ecuador con Haversine', () => {
    expect(calcularDistanciaKm(cero, este)).toBeCloseTo(111.1949266, 5)
  })

  it('calcula la distancia conocida entre Nueva York y París', () => {
    expect(calcularDistanciaKm({ latitud: 40.7128, longitud: -74.006 }, { latitud: 48.8566, longitud: 2.3522 })).toBeCloseTo(5837.24, 1)
  })

  it('devuelve cero para puntos coincidentes y admite coordenadas negativas', () => {
    const buenosAires = { latitud: -34.6, longitud: -58.4 }
    expect(calcularDistanciaKm(buenosAires, buenosAires)).toBe(0)
    expect(calcularDistanciaKm(buenosAires, { latitud: -34.6, longitud: -58.5 })).toBeCloseTo(9.15, 1)
  })

  it('es simétrica, cruza el antimeridiano por el lado corto y admite los polos', () => {
    const a = { latitud: 0, longitud: 179 }
    const b = { latitud: 0, longitud: -179 }
    expect(calcularDistanciaKm(a, b)).toBeCloseTo(222.38985, 4)
    expect(calcularDistanciaKm(a, b)).toBe(calcularDistanciaKm(b, a))
    expect(calcularDistanciaKm({ latitud: 90, longitud: 180 }, { latitud: -90, longitud: -180 })).toBeCloseTo(Math.PI * 6371, 6)
  })

  it('tolera antípodas y puntos muy próximos sin devolver NaN', () => {
    expect(calcularDistanciaKm(cero, { latitud: 0, longitud: 180 })).toBeCloseTo(Math.PI * 6371, 6)
    expect(calcularDistanciaKm(cero, { latitud: 0.00000001, longitud: 0.00000001 })).toBeGreaterThan(0)
  })

  it('admite números decimales serializados y el formato lat/lng ya utilizado', () => {
    expect(calcularDistanciaKm({ lat: '0', lng: '0' }, { latitud: '0', longitud: '1' })).toBeCloseTo(111.1949266, 5)
  })

  it.each([
    null, undefined, {}, { latitud: null, longitud: 0 }, { latitud: 0 },
    { latitud: NaN, longitud: 0 }, { latitud: 0, longitud: Infinity },
    { latitud: 91, longitud: 0 }, { latitud: -91, longitud: 0 },
    { latitud: 0, longitud: 181 }, { latitud: 0, longitud: -181 },
    { latitud: '', longitud: 0 }, { latitud: '  ', longitud: 0 },
    { latitud: 'abc', longitud: 0 }, { latitud: true, longitud: 0 },
    { latitud: [], longitud: 0 }, { latitud: 0, longitud: false },
  ])('rechaza coordenadas inválidas en cualquiera de los puntos: %j', (invalido) => {
    expect(calcularDistanciaKm(invalido, cero)).toBeNull()
    expect(calcularDistanciaKm(cero, invalido)).toBeNull()
    expect(textoDistancia(invalido, cero)).toBeNull()
    expect(textoDistancia(cero, invalido)).toBe('Distancia no disponible')
  })

  it('no usa una distancia de API preexistente o inventada si faltan coordenadas', () => {
    expect(textoDistancia(cero, { distanciaKm: 3 })).toBe('Distancia no disponible')
    expect(textoDistancia(null, { ...este, distanciaKm: 3 })).toBeNull()
  })

  it('explica la aproximación, usa kilómetros y no promete recorrido por calles', () => {
    expect(textoDistancia(cero, este)).toBe('Distancia aproximada: 111,2 km en línea recta (no por calles)')
    expect(textoDistancia(cero, cero)).toContain('0,0 km')
  })

  it('no modifica las coordenadas recibidas', () => {
    const origen = Object.freeze({ ...cero })
    const destino = Object.freeze({ ...este })
    calcularDistanciaKm(origen, destino)
    expect(destino).toEqual(este)
    expect(origen).toEqual(cero)
  })
})
