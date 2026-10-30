import { describe, expect, it } from 'vitest'
import { validarSolicitud, construirSolicitud, SOLICITUD_INICIAL } from '../utils/solicitudes'
const prestador = { id: 'p1', oficios: ['Plomero'], oficiosCatalogo: [{ id: 'o1', nombre: 'Plomero' }] }
const datos = { ...SOLICITUD_INICIAL, servicio: 'Plomero', descripcion: 'Canilla rota' }
describe('Formulario y DTO real de solicitudes', () => {
  it('acepta dirección y contacto opcionales', () => expect(validarSolicitud(datos, prestador)).toEqual({}))
  it('requiere un prestador', () => expect(validarSolicitud(datos, null).prestador).toBeTruthy())
  it('requiere un oficio seleccionado', () => expect(validarSolicitud({ ...datos, servicio: '' }, prestador).servicio).toBeTruthy())
  it('rechaza un oficio ajeno', () => expect(validarSolicitud({ ...datos, servicio: 'Otro' }, prestador).servicio).toBeTruthy())
  it('requiere descripción', () => expect(validarSolicitud({ ...datos, descripcion: ' ' }, prestador).descripcion).toBeTruthy())
  it('limita descripción a 1000', () => expect(validarSolicitud({ ...datos, descripcion: 'x'.repeat(1001) }, prestador).descripcion).toBeTruthy())
  it('envía IDs sin nombres de servicio ni fecha inexistente', () => {
    expect(construirSolicitud({ ...datos, fechaPreferida: '2026-12-01' }, prestador)).toEqual({ prestadorId: 'p1', oficioId: 'o1', descripcion: 'Canilla rota', direccion: '', contactoPreferido: '' })
  })
  it('incluye contacto preferido', () => expect(construirSolicitud({ ...datos, contactoPreferido: ' WhatsApp ' }, prestador).contactoPreferido).toBe('WhatsApp'))
  it('no inventa un ID a partir del nombre', () => expect(() => construirSolicitud(datos, { ...prestador, oficiosCatalogo: [] })).toThrow('identificar el oficio'))
})
