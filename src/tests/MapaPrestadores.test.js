import { describe, expect, it } from 'vitest'
import { obtenerCoordenadas, prestadoresConUbicacion } from '../utils/coordenadasPrestadores'

describe('F-07 - Coordenadas de prestadores', () => {
  it('acepta coordenadas válidas', () => {
    expect(obtenerCoordenadas({ latitud: -34.6, longitud: -58.4 }))
      .toEqual([-34.6, -58.4])
  })

  it('acepta lat y lng', () => {
    expect(obtenerCoordenadas({ lat: '-34.6', lng: '-58.4' }))
      .toEqual([-34.6, -58.4])
  })

  it('rechaza coordenadas faltantes', () => {
    expect(obtenerCoordenadas({ zonaCobertura: 'Palermo' })).toBeNull()
  })

  it('rechaza coordenadas fuera de rango', () => {
    expect(obtenerCoordenadas({ latitud: 120, longitud: -58 })).toBeNull()
  })

  it('rechaza valores no numéricos', () => {
    expect(obtenerCoordenadas({ latitud: 'abc', longitud: -58 })).toBeNull()
  })

  it('filtra prestadores sin coordenadas', () => {
    const lista = [
      { id: 1, latitud: -34.6, longitud: -58.4 },
      { id: 2, zonaCobertura: 'Palermo' },
    ]
    expect(prestadoresConUbicacion(lista)).toHaveLength(1)
  })
})
