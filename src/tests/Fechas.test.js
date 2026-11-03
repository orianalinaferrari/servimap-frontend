import { describe, expect, it } from 'vitest'
import { formatearFechaArgentina } from '../utils/fechas'

describe('Fechas para Argentina', () => {
  it.each([
    ['2026-11-03T01:30:00.000Z', '02/11/2026'],
    ['2026-11-03T03:00:00Z', '03/11/2026'],
    ['2026-11-03T00:30:00-03:00', '03/11/2026'],
    ['2026-11-03T04:30:00+02:00', '02/11/2026'],
    ['2026-01-01T01:00:00Z', '31/12/2025'],
    ['2026-11-03', '03/11/2026'],
    ['2024-02-29', '29/02/2024'],
  ])('formatea %s sin depender del huso del dispositivo', (valor, esperado) => {
    expect(formatearFechaArgentina(valor)).toBe(esperado)
  })

  it.each([
    null, undefined, '', 0, NaN, {}, 'ayer', '03/11/2026',
    '2026-11-03T00:30:00', '2026-02-29', '2026-02-30T12:00:00Z',
    '2026-13-01', '2026-01-00', '2026-11-03T25:00:00Z',
    '2026-11-03T12:00:00+25:00',
  ])('informa ausencia o fecha inválida sin inventar datos: %j', valor => {
    expect(formatearFechaArgentina(valor)).toBe('No disponible')
  })
})
