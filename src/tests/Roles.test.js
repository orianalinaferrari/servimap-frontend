
import { describe, expect, it } from 'vitest'
import {
  ROLES,
  normalizarRol,
  tieneRol,
} from '../utils/roles'

describe('F-04 - Roles y permisos', () => {
  it('reconoce los tres roles del sistema', () => {
    expect(normalizarRol('cliente')).toBe(ROLES.CLIENTE)
    expect(normalizarRol('PRESTADOR')).toBe(ROLES.PRESTADOR)
    expect(normalizarRol(' administrador ')).toBe(
      ROLES.ADMINISTRADOR
    )
  })

  it('rechaza roles desconocidos', () => {
    expect(normalizarRol('SUPERADMIN')).toBeNull()
    expect(normalizarRol(null)).toBeNull()
    expect(normalizarRol('')).toBeNull()
  })

  it('autoriza al cliente solamente para su rol', () => {
    const usuario = { id: 1, rol: 'CLIENTE' }

    expect(tieneRol(usuario, [ROLES.CLIENTE])).toBe(true)
    expect(tieneRol(usuario, [ROLES.ADMINISTRADOR])).toBe(false)
  })

  it('autoriza al prestador solamente para su rol', () => {
    const usuario = { id: 2, rol: 'PRESTADOR' }

    expect(tieneRol(usuario, [ROLES.PRESTADOR])).toBe(true)
    expect(tieneRol(usuario, [ROLES.CLIENTE])).toBe(false)
  })

  it('autoriza al administrador solamente para su rol', () => {
    const usuario = { id: 3, rol: 'ADMINISTRADOR' }

    expect(tieneRol(usuario, [ROLES.ADMINISTRADOR])).toBe(true)
    expect(tieneRol(usuario, [ROLES.PRESTADOR])).toBe(false)
  })

  it('rechaza usuarios sin autenticación o sin rol válido', () => {
    expect(tieneRol(null, [ROLES.CLIENTE])).toBe(false)
    expect(tieneRol({ rol: 'DESCONOCIDO' }, [ROLES.CLIENTE])).toBe(false)
    expect(tieneRol({ rol: 'CLIENTE' }, null)).toBe(false)
  })
})
