import { describe, expect, it } from 'vitest'
import { puedeMarcarTrabajoTerminado } from '../utils/finalizacionSolicitud'
describe('Finalización según contrato backend', () => {
  it('permite finalizar una solicitud aceptada sin indicador ficticio', () => {
    expect(puedeMarcarTrabajoTerminado({ id: 's1', estado: 'ACEPTADA' })).toBe(true)
  })
  it.each(['PENDIENTE','RECHAZADA','CANCELADA','FINALIZADA'])('no permite finalizar %s', (estado) => {
    expect(puedeMarcarTrabajoTerminado({ id: 's1', estado })).toBe(false)
  })
  it('requiere identificador', () => expect(puedeMarcarTrabajoTerminado({ estado: 'ACEPTADA' })).toBe(false))
})
