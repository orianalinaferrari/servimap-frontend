import { describe, expect, it } from 'vitest'
import { obtenerEnlaceWhatsApp } from '../utils/whatsapp'

describe('Enlaces internacionales de WhatsApp', () => {
  it.each([
    '+54 (11) 1234-5678', '+54 11 1234 5678', '+54-11-1234-5678',
    '+541112345678', '  +54 (11) 1234-5678  ',
  ])('elimina separadores sin cambiar los dígitos: %s', valor => {
    expect(obtenerEnlaceWhatsApp(valor)).toBe('https://wa.me/541112345678')
  })

  it('conserva un país distinto sin agregar prefijos argentinos', () => {
    expect(obtenerEnlaceWhatsApp('+44 20 7946 0958')).toBe('https://wa.me/442079460958')
  })

  it.each([
    null, undefined, '', 541112345678, {}, '5491112345678', '11 1234-5678',
    '0054 11 1234-5678', '+0123456789', '+123', '+1234567890123456',
    '+54 11 1234-5678 interno 9', '+54.11.12345678', '+54\n1112345678',
    'https://wa.me/541112345678', '+54+1112345678',
  ])('no genera un enlace si el formato internacional es ambiguo o inválido: %j', valor => {
    expect(obtenerEnlaceWhatsApp(valor)).toBeNull()
  })
})
