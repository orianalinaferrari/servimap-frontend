import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import App from '../App'

describe('App', () => {
  test('muestra el nombre de ServiMap', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'ServiMap' })).toBeTruthy()
  })
})
