import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { esEmailValido } from '../utils/email'
import { crearPerfilInicial, validarPerfilPrestador } from '../utils/perfilPrestador'
import { cargarCatalogoOficios, guardarCatalogoOficios, validarCatalogoGuardado, CLAVE_CATALOGO_OFICIOS } from '../utils/adminOficios'
import { ApiError } from '../services/apiClient'
import { traducirErrorApi } from '../services/apiServiceErrors'
import { DetallePrestador } from '../components/DetallePrestador'
import PanelCliente from '../pages/PanelCliente'
import AccesoDenegado from '../pages/AccesoDenegado'

afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks() })

describe('Validación acotada de datos externos', () => {
  it.each(['a@b.test', 'persona+alias@sub.dominio.test'])('acepta direcciones utilizables: %s', (email) => {
    expect(esEmailValido(email)).toBe(true)
  })
  it.each(['a@b', '@b.test', 'a@.test', 'a@b.', 'a@@b.test', 'a b@c.test', 'a'.repeat(100000) + '@b.test', null])('rechaza correo inválido sin backtracking: %s', (email) => {
    expect(esEmailValido(email)).toBe(false)
  })
  it('valida campos obligatorios y conserva los datos iniciales de perfil', () => {
    const vacio = crearPerfilInicial()
    expect(validarPerfilPrestador(vacio)).toMatchObject({ nombre: expect.any(String), apellido: expect.any(String), telefono: expect.any(String), ubicacion: expect.any(String) })
    const perfil = crearPerfilInicial({ nombre: 'Ana', apellido: 'Demo', telefono: '12345678', email: 'invalido', ubicacion: 'Centro', oficios: ['Plomero'] })
    expect(perfil.oficios).toBe('Plomero')
    expect(validarPerfilPrestador(perfil).email).toBeDefined()
    perfil.email = 'ana@example.test'
    expect(validarPerfilPrestador(perfil).email).toBeUndefined()
    expect(crearPerfilInicial({ oficios: 'Electricista' }).oficios).toBe('Electricista')
  })
  it('muestra contenido externo como texto sin ejecutar HTML', () => {
    const texto = '<img src=x onerror="alert(1)">'
    const { container } = render(<DetallePrestador prestador={{ id: 'qa', nombre: texto, descripcionProfesional: texto, oficios: [], disponible: false, calificacionPromedio: null }} onVolver={() => {}} />)
    expect(screen.getByRole('heading', { name: texto })).toBeTruthy()
    expect(container.querySelector('img, script')).toBeNull()
    expect(screen.getByRole('button', { name: 'Solicitar servicio' }).disabled).toBe(true)
  })
})

describe('Catálogo local heredado: datos corruptos no se confían', () => {
  it.each([null, {}, [null], [{ id: -1 }], [{ id: 1, nombre: 'Gasista', activo: 'true' }], [{ id: 1, nombre: '<script>', activo: true }], [{ id: 1, nombre: 'Gasista', activo: true }, { id: 1, nombre: 'Pintor', activo: true }], [{ id: 1, nombre: 'Gasista', activo: true }, { id: 2, nombre: 'Gásista', activo: true }]])('rechaza estructura manipulada %#', (dato) => {
    expect(validarCatalogoGuardado(dato)).toBeNull()
  })
  it('recupera catálogo válido, y usa el inicial ante JSON corrupto o falta de almacenamiento', () => {
    const catalogo = [{ id: 4, nombre: 'Gasista', activo: false }]
    guardarCatalogoOficios(catalogo)
    expect(cargarCatalogoOficios()).toEqual(catalogo)
    localStorage.setItem(CLAVE_CATALOGO_OFICIOS, '{')
    expect(cargarCatalogoOficios().length).toBeGreaterThan(0)
    localStorage.setItem(CLAVE_CATALOGO_OFICIOS, 'null')
    expect(cargarCatalogoOficios().length).toBeGreaterThan(0)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Bloqueado') })
    expect(cargarCatalogoOficios().length).toBeGreaterThan(0)
  })
})

describe('Errores y pantallas de acceso', () => {
  it.each([
    [{ codigo: 'ERROR_RED' }, {}, 'No se pudo conectar'],
    [{ status: 403 }, { 403: 'Acceso rechazado' }, 'Acceso rechazado'],
    [{ codigo: 'JSON_INVALIDO' }, {}, 'respuesta no válida'],
    [{ codigo: 'ERROR_RESPUESTA' }, {}, 'respuesta no válida'],
    [{ status: 500 }, { general: 'Reintentá' }, 'Reintentá'],
    [{ status: 409 }, {}, 'Fallo original'],
  ])('conserva mensajes de error seguros %#', (opciones, mensajes, texto) => {
    expect(() => traducirErrorApi(new ApiError('Fallo original', opciones), mensajes)).toThrow(texto)
  })
  it('no oculta errores de programación', () => {
    const error = new TypeError('Programación')
    expect(() => traducirErrorApi(error)).toThrow(error)
  })
  it('mantiene accesos del cliente y pantalla de denegación', () => {
    render(<MemoryRouter><PanelCliente /><AccesoDenegado /></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Buscar prestadores' }).getAttribute('href')).toBe('/prestadores')
    expect(screen.getByRole('link', { name: 'Mis solicitudes' }).getAttribute('href')).toBe('/cliente/solicitudes')
    expect(screen.getByRole('heading', { name: /Acceso denegado/i })).toBeTruthy()
  })
})
