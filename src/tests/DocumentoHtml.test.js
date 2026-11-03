import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const html = new DOMParser().parseFromString(readFileSync('index.html', 'utf8'), 'text/html')

describe('Documento público de ServiMap', () => {
  it('declara el idioma argentino para tecnologías de asistencia', () => {
    expect(html.documentElement.lang).toBe('es-AR')
  })
  it('identifica la pestaña como ServiMap y conserva su favicon', () => {
    expect(html.title).toBe('ServiMap')
    expect(html.querySelector('link[rel="icon"]').getAttribute('href')).toBe('/favicon.svg?v=servimap')
    expect(html.querySelector('link[rel="icon"]').getAttribute('type')).toBe('image/svg+xml')
  })
})
