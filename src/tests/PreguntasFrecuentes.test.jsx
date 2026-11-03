import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom/vitest'
import App from '../App'
import AyudaBreve from '../components/AyudaBreve'
import { useAuth } from '../context/useAuth'

vi.mock('../context/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('../services/solicitudesPrestadorService', async (importOriginal) => ({
  ...await importOriginal(),
  obtenerSolicitudesPrestador: vi.fn(async () => []),
}))
afterEach(cleanup)

function abrir(ruta = '/ayuda', rol = null) {
  vi.mocked(useAuth).mockReturnValue({
    usuario: rol ? { id: 'usuario-qa', nombre: 'Prueba', rol } : null,
    autenticado: Boolean(rol), cargando: false, logout: vi.fn(),
  })
  return render(<MemoryRouter initialEntries={[ruta]}><App /></MemoryRouter>)
}

describe('Preguntas frecuentes', () => {
  it.each([null, 'CLIENTE', 'PRESTADOR', 'ADMINISTRADOR'])('permite acceso directo y muestra el enlace activo para %s', (rol) => {
    abrir('/ayuda', rol)
    expect(screen.getByRole('main')).toHaveAccessibleName('Preguntas frecuentes')
    expect(screen.getByRole('link', { name: 'Ayuda' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each(['/', '/login', '/registro'])('permite llegar a la ayuda desde %s y volver al inicio', (ruta) => {
    abrir(ruta)
    fireEvent.click(screen.getByRole('link', { name: 'Ayuda' }))
    expect(screen.getByRole('heading', { name: 'Preguntas frecuentes' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: 'ServiMap, inicio' }))
    expect(screen.getByRole('heading', { name: /Lo que necesitás/ })).toBeInTheDocument()
  })

  it.each([
    ['/cliente', 'CLIENTE', 'Mi espacio', 'Mi espacio'],
    ['/prestador', 'PRESTADOR', 'Mi espacio', 'Mi espacio'],
  ])('permite consultar la ayuda desde %s y regresar al panel conservando la sesión', async (ruta, rol, titulo, enlacePanel) => {
    await act(async () => abrir(ruta, rol))
    expect(screen.getByRole('heading', { name: titulo })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: 'Ayuda' }))
    expect(screen.getByRole('main')).toHaveAccessibleName('Preguntas frecuentes')
    expect(screen.getByRole('link', { name: enlacePanel })).toHaveAttribute('href', ruta)
    await act(async () => fireEvent.click(screen.getByRole('link', { name: enlacePanel })))
    expect(screen.getByRole('heading', { name: titulo })).toBeInTheDocument()
    expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('despliega y cierra cada una de las diez preguntas sin abrir las demás', () => {
    const { container } = abrir()
    const preguntas = [...container.querySelectorAll('details')]
    expect(preguntas).toHaveLength(10)
    for (const pregunta of preguntas) {
      expect(pregunta.open).toBe(false)
      const resumen = pregunta.querySelector('summary')
      expect(within(resumen).getByRole('heading', { level: 3 })).toHaveTextContent(/\?$/)
      fireEvent.click(resumen)
      expect(pregunta.open).toBe(true)
      expect(preguntas.filter((item) => item.open)).toEqual([pregunta])
      expect(pregunta.querySelector('.ayuda-respuesta')).toBeVisible()
      fireEvent.click(resumen)
      expect(pregunta.open).toBe(false)
      expect(pregunta.querySelector('.ayuda-respuesta')).not.toBeVisible()
    }
  })

  it('ofrece enlaces a los grupos con nombres accesibles y destinos existentes', () => {
    abrir()
    const nav = screen.getByRole('navigation', { name: 'Temas de ayuda' })
    for (const enlace of within(nav).getAllByRole('link')) {
      const destino = document.querySelector(enlace.getAttribute('href'))
      expect(destino).toHaveAccessibleName(enlace.textContent)
    }
  })

  it.each([
    ['pagos', /no cobra ni procesa pagos/],
    ['inicio-sesion', /no ofrece recuperación de contraseña/],
    ['buscar', /El filtro de precio compara tu máximo con el precio mínimo/],
    ['cancelar', /Solo podés cancelar solicitudes propias en estado Pendiente o Aceptada/],
    ['calificar', /Solo se permite una calificación por solicitud/],
    ['finalizado-sin-realizar', /no tiene un sistema de reclamos o disputas/],
    ['responder', /Solo podés responder solicitudes dirigidas a vos/],
    ['finalizar', /Finalizar un trabajo no registra ni confirma un pago/],
    ['perfil', /El nombre y el email de la cuenta/],
    ['oficios', /agregar o quitar en pantalla no guarda los cambios por sí solo/],
  ])('presenta la respuesta de %s solo al abrir su pregunta', (id, texto) => {
    abrir()
    const pregunta = document.getElementById(`faq-${id}`)
    const respuesta = within(pregunta).getByText(texto)
    expect(respuesta).not.toBeVisible()
    fireEvent.click(pregunta.querySelector('summary'))
    expect(respuesta).toBeVisible()
    fireEvent.click(pregunta.querySelector('summary'))
    expect(respuesta).not.toBeVisible()
  })

  it('mantiene visibles las limitaciones reales y enlaza los recorridos existentes', () => {
    const { container } = abrir()
    for (const pregunta of container.querySelectorAll('details')) fireEvent.click(pregunta.querySelector('summary'))
    expect(screen.getByText(/no cobra ni procesa pagos/)).toBeVisible()
    expect(screen.getByText(/no tiene un sistema de reclamos o disputas/)).toBeVisible()
    expect(screen.getByText(/no pide una confirmación del cliente/)).toBeVisible()
    expect(screen.getByText(/no ofrece recuperación de contraseña/)).toBeVisible()
    expect(screen.getByText(/Solo podés cancelar solicitudes propias en estado Pendiente o Aceptada/)).toBeVisible()
    expect(screen.getByText(/Solo se permite una calificación por solicitud/)).toBeVisible()
    expect(screen.getByText(/agregar o quitar en pantalla no guarda los cambios por sí solo/)).toBeVisible()
    expect(screen.getByRole('link', { name: 'Ir a mis solicitudes de cliente' })).toHaveAttribute('href', '/cliente/solicitudes')
    expect(screen.getByRole('link', { name: 'Ir a mis solicitudes de prestador' })).toHaveAttribute('href', '/prestador/solicitudes')
    expect(screen.getByRole('link', { name: 'Ir a mi perfil de prestador' })).toHaveAttribute('href', '/prestador/perfil')
    expect(screen.getByRole('link', { name: 'Ir a mis oficios' })).toHaveAttribute('href', '/prestador/oficios')
    fireEvent.click(screen.getByRole('link', { name: 'Ir a iniciar sesión' }))
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('Ayuda breve accesible', () => {
  it('el contenedor no actúa como control de teclado; Escape pertenece al botón nativo', () => {
    render(<AyudaBreve etiqueta="Ubicación">Ubicación aproximada.</AyudaBreve>)
    const boton = screen.getByRole('button', { name: 'Ayuda sobre ubicación' })
    act(() => boton.focus())
    expect(boton.parentElement).not.toHaveAttribute('tabindex')
    expect(boton.parentElement).not.toHaveAttribute('role', 'button')
    fireEvent.keyDown(boton.parentElement, { key: 'Escape' })
    expect(screen.getByRole('tooltip')).toBeVisible()
    fireEvent.keyDown(boton, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(boton).toHaveFocus()
  })

  it('mantiene el hover al pasar al texto de ayuda y cierra al salir con el foco fuera', () => {
    render(<AyudaBreve etiqueta="Precio">Referencia de precio.</AyudaBreve>)
    const boton = screen.getByRole('button')
    fireEvent.mouseEnter(boton)
    const tooltip = screen.getByRole('tooltip')
    fireEvent.blur(boton, { relatedTarget: tooltip })
    fireEvent.mouseLeave(boton, { relatedTarget: tooltip })
    expect(tooltip).toBeVisible()
    fireEvent.mouseLeave(boton.parentElement)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  function montar() {
    render(<><AyudaBreve etiqueta="Precio de referencia">No es un presupuesto confirmado.</AyudaBreve><button>Otro control</button></>)
    return screen.getByRole('button', { name: 'Ayuda sobre precio de referencia' })
  }

  it('se muestra al enfocar, se asocia como descripción y se cierra con Escape sin mover el foco', () => {
    const boton = montar()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    act(() => boton.focus())
    expect(boton).toHaveAccessibleDescription('No es un presupuesto confirmado.')
    expect(screen.getByRole('tooltip')).toHaveAttribute('id', boton.getAttribute('aria-describedby'))
    fireEvent.keyDown(boton, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(boton).toHaveFocus()
    expect(boton).not.toHaveAttribute('aria-describedby')
  })

  it('se abre al tocar o hacer clic y se cierra al enfocar otro control', () => {
    const boton = montar()
    fireEvent.click(boton)
    expect(screen.getByRole('tooltip')).toBeVisible()
    act(() => boton.focus())
    act(() => screen.getByRole('button', { name: 'Otro control' }).focus())
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('permanece abierto al pasar del botón al tooltip y se oculta al salir del conjunto', () => {
    const boton = montar()
    const conjunto = boton.parentElement
    fireEvent.mouseEnter(conjunto)
    expect(screen.getByRole('tooltip')).toBeVisible()
    fireEvent.mouseLeave(boton, { relatedTarget: screen.getByRole('tooltip') })
    expect(screen.getByRole('tooltip')).toBeVisible()
    fireEvent.mouseLeave(conjunto)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('conserva la ayuda al retirar el puntero si el botón sigue enfocado', () => {
    const boton = montar()
    act(() => boton.focus())
    fireEvent.mouseLeave(boton.parentElement)
    expect(screen.getByRole('tooltip')).toBeVisible()
  })

  it('no oculta la explicación con otras teclas y permite reabrirla después de Escape', () => {
    const boton = montar()
    act(() => boton.focus())
    for (const key of ['Enter', ' ', 'ArrowDown']) {
      fireEvent.keyDown(boton, { key })
      expect(screen.getByRole('tooltip')).toBeVisible()
    }
    fireEvent.keyDown(boton, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    fireEvent.click(boton)
    expect(screen.getByRole('tooltip')).toBeVisible()
    expect(boton).toHaveAccessibleDescription('No es un presupuesto confirmado.')
  })

  it('retira la descripción cuando el foco sale de la página', () => {
    const boton = montar()
    act(() => boton.focus())
    act(() => boton.blur())
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(boton).not.toHaveAttribute('aria-describedby')
  })

  it('asocia cada tooltip con su propio control y oculta el anterior al cambiar el foco', () => {
    render(<>
      <AyudaBreve etiqueta="Precio de referencia">El precio se acuerda entre las partes.</AyudaBreve>
      <AyudaBreve etiqueta="Ubicación aproximada">No es el domicilio exacto.</AyudaBreve>
    </>)
    const precio = screen.getByRole('button', { name: 'Ayuda sobre precio de referencia' })
    const ubicacion = screen.getByRole('button', { name: 'Ayuda sobre ubicación aproximada' })
    act(() => precio.focus())
    const idPrecio = precio.getAttribute('aria-describedby')
    act(() => ubicacion.focus())
    expect(precio).not.toHaveAttribute('aria-describedby')
    expect(ubicacion).toHaveAccessibleDescription('No es el domicilio exacto.')
    expect(ubicacion.getAttribute('aria-describedby')).not.toBe(idPrecio)
    expect(screen.getAllByRole('tooltip')).toHaveLength(1)
  })
})
