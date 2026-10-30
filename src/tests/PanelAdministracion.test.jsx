import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import { PanelAdministracion } from '../components/PanelAdministracion'
import { renderConAdministrador } from './helpers/renderConAdministrador'

afterEach(cleanup)

describe('PanelAdministracion', () => {
  test('abre el panel desde la ruta de administración', () => {
    renderConAdministrador('/admin')

    expect(
      screen.getByRole('heading', { name: 'Panel de administración' })
    ).toBeTruthy()
  })

  test('muestra la sección de comentarios por defecto', () => {
    render(<PanelAdministracion calificaciones={[]} />)

    expect(
      screen.getByRole('heading', { name: 'Comentarios publicados' })
    ).toBeTruthy()
  })

  test('separa publicados y ocultos con contadores derivados y sin acciones de restauración', () => {
    render(<PanelAdministracion calificaciones={[
      { id: 'a', clienteNombre: 'Cliente visible', prestadorId: 'p', puntaje: 4, comentario: 'Texto publicado', moderada: false },
      { id: 'b', clienteNombre: 'Cliente moderado', prestadorId: 'p', moderada: true, motivoModeracion: 'Motivo existente' },
    ]} />)
    const publicados = within(screen.getByRole('region', { name: 'Comentarios publicados' }))
    const ocultos = within(screen.getByRole('region', { name: 'Comentarios ocultos' }))
    expect(publicados.getByText('Total: 1')).toBeTruthy()
    expect(publicados.getByText('4/5')).toBeTruthy()
    expect(ocultos.getByText('Total: 1')).toBeTruthy()
    expect(ocultos.getByText('Motivo: Motivo existente')).toBeTruthy()
    expect(ocultos.queryByRole('button')).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Listado de oficios' })).toBeNull()
  })

  test('cambia de sección al hacer clic', () => {
    render(<PanelAdministracion calificaciones={[]} />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Administración de oficios' })
    )

    expect(
      screen.getByRole('heading', { name: 'Administración de oficios' })
    ).toBeTruthy()
  })
})
