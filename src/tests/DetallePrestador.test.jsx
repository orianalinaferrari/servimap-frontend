import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import { BuscadorPrestadores } from '../components/BuscadorPrestadores'
import { prestadoresMock } from '../data/prestadoresMock'
import { DetallePrestador } from '../components/DetallePrestador'
import '@testing-library/jest-dom/vitest'

afterEach(cleanup)

describe('Detalle del prestador', () => {
  test('ofrece un enlace de WhatsApp normalizado para un número internacional', () => {
    render(<DetallePrestador prestador={{ ...prestadoresMock[0], whatsapp: '+54 (11) 1234-5678' }} />)
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', 'https://wa.me/541112345678')
    expect(screen.getByRole('link', { name: prestadoresMock[0].telefono })).toHaveAttribute('href', `tel:${prestadoresMock[0].telefono}`)
  })

  test.each(['11 1234-5678', '5491112345678', '+54 numero inválido'])('conserva el contacto sin inventar un enlace para %s', whatsapp => {
    render(<DetallePrestador prestador={{ ...prestadoresMock[0], whatsapp }} />)
    expect(screen.queryByRole('link', { name: 'WhatsApp' })).not.toBeInTheDocument()
    expect(screen.getByText(`WhatsApp: ${whatsapp}`)).toBeVisible()
    expect(screen.getByText(/Enlace no disponible/)).toBeVisible()
  })

  test.each([null, undefined, ''])('no ofrece contacto de WhatsApp cuando está ausente: %j', whatsapp => {
    const { container } = render(<DetallePrestador prestador={{ ...prestadoresMock[0], whatsapp }} />)
    expect(screen.queryByText(/WhatsApp:/)).not.toBeInTheDocument()
    expect(container.querySelector('a[href^="https://wa.me/"]')).toBeNull()
  })

  test('muestra el detalle al hacer clic en un prestador', () => {
    render(<BuscadorPrestadores prestadores={prestadoresMock} />)

    fireEvent.click(screen.getByRole('button', { name: 'Carlos Gómez' }))

    expect(screen.getByText(/10 años de experiencia/)).toBeTruthy()
    expect(screen.getByText('Calificación: 4.5 / 5')).toBeTruthy()
  })

  test('muestra "Sin calificaciones" si no tiene calificaciones', () => {
    render(<BuscadorPrestadores prestadores={prestadoresMock} />)

    fireEvent.click(screen.getByRole('button', { name: 'Javier López' }))

    expect(screen.getByText('Sin calificaciones')).toBeTruthy()
  })

  test('muestra "No disponible" si el prestador no está disponible', () => {
    render(<BuscadorPrestadores prestadores={prestadoresMock} />)

    fireEvent.click(screen.getByRole('button', { name: 'Martín Rodríguez' }))

    expect(screen.getByText('No disponible')).toBeTruthy()
  })

  test('vuelve a la lista al hacer clic en Volver', () => {
    render(<BuscadorPrestadores prestadores={prestadoresMock} />)

    fireEvent.click(screen.getByRole('button', { name: 'Carlos Gómez' }))
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }))

    expect(screen.getAllByRole('listitem')).toHaveLength(7)
  })
})
