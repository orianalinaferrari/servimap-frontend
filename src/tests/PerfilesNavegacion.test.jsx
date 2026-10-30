import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/authContextInstance'
import AvatarSesion from '../components/auth/AvatarSesion'
import NavegacionRoles from '../components/auth/NavegacionRoles'
import PerfilCliente from '../pages/PerfilCliente'
import CompletarPerfilPrestador from '../pages/CompletarPerfilPrestador'
import { VistaPerfilPrestador } from '../components/prestador/VistaPerfilPrestador'
import { camposPendientesPrestador, obtenerIniciales } from '../utils/perfilUsuario'
import { obtenerPerfilPorRol } from '../utils/roles'
import { BASE, instalarHttp, perfilPrueba, respuesta } from './helpers/contratos'

afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.unstubAllGlobals() })

function Ubicacion() { return <output data-testid="ruta">{useLocation().pathname}</output> }
function montar(elemento, { usuario = null, ruta = '/' } = {}) {
  return render(<AuthContext.Provider value={{ usuario, cargando: false, autenticado: Boolean(usuario) }}>
    <MemoryRouter initialEntries={[ruta]}>{elemento}<Ubicacion /></MemoryRouter>
  </AuthContext.Provider>)
}

describe('Iniciales del avatar', () => {
  it.each([
    ['Delfina Favonio', 'DF'],
    ['Oriana Lina Ferrari', 'OF'],
    ['Martín Pérez', 'MP'],
    ['  ángel   ÑANDÚ  ', 'ÁÑ'],
    ['Ángel'.normalize('NFD') + ' Ruiz', 'ÁR'],
    ['Cher', 'C'],
    ['(Ana) — López', 'AL'],
    ['', ''],
    [null, ''],
  ])('%s → %s', (nombre, esperado) => expect(obtenerIniciales(nombre)).toBe(esperado))
})

describe('Completitud del perfil profesional', () => {
  it('detecta cada dato pendiente a partir del contrato real', () => {
    expect(camposPendientesPrestador(null)).toEqual([])
    expect(camposPendientesPrestador({ descripcionProfesional: null, zonaCobertura: '', telefono: ' ', oficios: [] }))
      .toEqual(['Descripción profesional', 'Zona de cobertura', 'Al menos un medio de contacto', 'Al menos un oficio'])
    expect(camposPendientesPrestador({ ...perfilPrueba, emailContacto: 'contacto@example.test' })).toEqual([])
  })
  it('solo CLIENTE y PRESTADOR tienen ruta de perfil', () => {
    expect(obtenerPerfilPorRol('cliente')).toBe('/cliente/perfil')
    expect(obtenerPerfilPorRol('PRESTADOR')).toBe('/prestador/perfil')
    expect(obtenerPerfilPorRol('ADMINISTRADOR')).toBeNull()
  })
})

describe('Avatar del header', () => {
  it.each([
    ['CLIENTE', '/cliente/perfil'],
    ['PRESTADOR', '/prestador/perfil'],
  ])('el avatar de %s es un botón accesible hacia su perfil', (rol, destino) => {
    montar(<AvatarSesion usuario={{ nombre: 'Oriana Lina Ferrari', rol }} />)
    const boton = screen.getByRole('button', { name: 'Ir a mi perfil' })
    expect(boton).toHaveTextContent('OF')
    expect(boton).toHaveAttribute('type', 'button')
    fireEvent.click(boton)
    expect(screen.getByTestId('ruta')).toHaveTextContent(destino)
  })
  it('el administrador no recibe un botón hacia una ruta inexistente', () => {
    montar(<AvatarSesion usuario={{ nombre: 'Admin General', rol: 'ADMINISTRADOR' }} />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByRole('img', { name: 'Sesión iniciada: Admin General' })).toHaveTextContent('AG')
  })
  it('usa un ícono genérico cuando no hay nombre', () => {
    const { container } = montar(<AvatarSesion usuario={{ nombre: '  ', rol: 'CLIENTE' }} />)
    expect(screen.getByRole('button', { name: 'Ir a mi perfil' })).toHaveTextContent('')
    expect(container.querySelector('.avatar-sesion svg')).not.toBeNull()
    cleanup()
    montar(<AvatarSesion usuario={{ rol: 'ADMINISTRADOR' }} />)
    expect(screen.getByRole('img', { name: 'Sesión iniciada' })).toBeInTheDocument()
  })
  it('la navegación ya no repite el enlace textual «Mi perfil»', () => {
    for (const rol of ['CLIENTE', 'PRESTADOR', 'ADMINISTRADOR']) {
      montar(<NavegacionRoles />, { usuario: { nombre: 'Ana', rol } })
      const nav = screen.getByRole('navigation', { name: 'Navegación según rol' })
      expect(within(nav).queryByRole('link', { name: 'Mi perfil' })).toBeNull()
      expect(within(nav).getByRole('link', { name: 'Explorar servicios' })).toBeInTheDocument()
      cleanup()
    }
  })
  it('el perfil del prestador usa el mismo criterio de iniciales', () => {
    montar(<VistaPerfilPrestador perfil={{ ...perfilPrueba, nombre: 'Oriana Lina Ferrari' }} onEditar={() => {}} />)
    expect(document.querySelector('.prestador-avatar')).toHaveTextContent('OF')
  })
  it.each([
    [{ precioMin: 5000, precioMax: null }, 'Desde $ 5.000'],
    [{ precioMin: null, precioMax: 9000 }, 'Hasta $ 9.000'],
    [{ precioMin: null, precioMax: null }, 'Sin informar'],
  ])('el perfil del prestador informa rangos parciales de precio %o', (precios, texto) => {
    montar(<VistaPerfilPrestador perfil={{ ...perfilPrueba, ...precios, nombre: '', descripcionProfesional: '', zonaCobertura: '', disponible: false, oficios: [] }} onEditar={() => {}} />)
    expect(screen.getByText('Rango de precios').nextElementSibling).toHaveTextContent(texto)
    expect(screen.getByText('Sin oficios asociados')).toBeInTheDocument()
    expect(screen.getByText('Sin descripción profesional')).toBeInTheDocument()
    expect(screen.getAllByText('No disponible').length).toBeGreaterThan(0)
    expect(document.querySelector('.prestador-avatar svg')).not.toBeNull()
  })
})

describe('Perfil del cliente', () => {
  it('muestra los datos de /api/auth/me y el DNI sin campos editables', () => {
    montar(<PerfilCliente />, { usuario: { id: 'c1', nombre: 'Delfina Favonio', email: 'delfina@example.test', dni: '12345678', rol: 'CLIENTE', fechaRegistro: '2026-03-01T12:00:00.000Z' } })
    expect(screen.getByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument()
    expect(screen.getByText('12345678')).toBeInTheDocument()
    expect(screen.getByText(new Date('2026-03-01T12:00:00.000Z').toLocaleDateString('es-AR'))).toBeInTheDocument()
    expect(document.querySelector('.prestador-avatar')).toHaveTextContent('DF')
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByRole('note')).toHaveTextContent('el DNI no se puede modificar')
    expect(screen.getByRole('link', { name: '← Volver al panel' })).toHaveAttribute('href', '/cliente')
  })
  it('indica los datos que el servidor no informa', () => {
    montar(<PerfilCliente />, { usuario: { id: 'c1', nombre: '', email: 'sin-dni@example.test', rol: 'CLIENTE', fechaRegistro: 'fecha-invalida' } })
    expect(screen.getByRole('heading', { name: 'Sin nombre registrado' })).toBeInTheDocument()
    expect(screen.getAllByText('No informado por el servidor')).toHaveLength(3)
  })
})

describe('Completar perfil del prestador', () => {
  let http, perfil
  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', BASE)
    perfil = { ...perfilPrueba, descripcionProfesional: '', zonaCobertura: null, oficios: [] }
    http = instalarHttp((url, config) => {
      if (url.pathname !== '/api/prestadores/me') return null
      if (config.method === 'PUT') perfil = { ...perfil, ...JSON.parse(config.body) }
      return respuesta(perfil)
    })
  })
  const mostrar = () => montar(<Routes><Route path="/prestador/completar-perfil" element={<CompletarPerfilPrestador />} /><Route path="/prestador" element={<p>Panel del prestador</p>} /></Routes>, { ruta: '/prestador/completar-perfil' })

  it('lista los pendientes, reutiliza el formulario y navega al panel al guardar', async () => {
    mostrar()
    const pendientes = within(await screen.findByRole('list'))
    expect(pendientes.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Descripción profesional', 'Zona de cobertura', 'Al menos un medio de contacto', 'Al menos un oficio'])
    expect(screen.getByRole('link', { name: 'Elegir mis oficios' })).toHaveAttribute('href', '/prestador/oficios')
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    fireEvent.change(screen.getByLabelText('Zona de cobertura'), { target: { value: 'Córdoba Centro' } })
    fireEvent.change(screen.getByLabelText('Descripción profesional'), { target: { value: 'Electricista matriculado' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(screen.getByTestId('ruta')).toHaveTextContent('/prestador'))
    const [url, config] = http.mock.calls.find(([, c]) => c.method === 'PUT')
    expect(url).toBe(BASE + '/api/prestadores/me')
    expect(JSON.parse(config.body)).toMatchObject({ zonaCobertura: 'Córdoba Centro', descripcionProfesional: 'Electricista matriculado' })
  })
  it('ofrece salir al panel sin guardar', async () => {
    mostrar()
    fireEvent.click(await screen.findByRole('button', { name: 'Completar más tarde' }))
    expect(screen.getByTestId('ruta')).toHaveTextContent('/prestador')
    expect(http.mock.calls.some(([, c]) => c.method === 'PUT')).toBe(false)
  })
  it('informa un perfil ya completo', async () => {
    perfil = { ...perfilPrueba, telefono: '+54 351 555-5555' }
    mostrar()
    expect(await screen.findByText('Tu perfil profesional ya está completo.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Elegir mis oficios' })).toBeNull()
  })
  it('muestra el error de consulta y permite reintentar', async () => {
    http.mockResolvedValueOnce(respuesta({ error: 'Perfil de prestador no encontrado' }, 404))
    mostrar()
    expect(await screen.findByRole('alert')).toHaveTextContent('Perfil de prestador no encontrado')
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar perfil' }))
    expect(await screen.findByText('Datos pendientes')).toBeInTheDocument()
  })
})
