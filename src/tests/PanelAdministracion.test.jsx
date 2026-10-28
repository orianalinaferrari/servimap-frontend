import { cleanup, fireEvent, render, screen } from '@testing-library/react'
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
    render(<PanelAdministracion />)

    expect(
      screen.getByRole('heading', { name: 'Comentarios publicados' })
    ).toBeTruthy()
  })

  test('cambia de sección al hacer clic', () => {
    render(<PanelAdministracion />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Administración de oficios' })
    )

    expect(
      screen.getByRole('heading', { name: 'Administración de oficios' })
    ).toBeTruthy()
  })
})
