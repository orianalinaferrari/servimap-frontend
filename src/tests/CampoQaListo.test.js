import { afterEach, describe, expect, it } from 'vitest'
import { campoQaListo, argumentosGraficosQa } from '../../scripts/qa/protocolo-cdp.mjs'

afterEach(() => { document.body.innerHTML = '' })
describe('Interacciones QA esperan controles utilizables', () => {
  it('no acepta un control ausente', () => {
    expect(campoQaListo(document, 'campo', 'x')).toBe(false)
  })
  it('espera que el input termine de cargar', () => {
    document.body.innerHTML = '<input id="campo" disabled>'
    expect(campoQaListo(document, 'campo', 'x')).toBe(false)
    document.getElementById('campo').disabled = false
    expect(campoQaListo(document, 'campo', 'x')).toBe(true)
  })
  it('espera la opción solicitada, no solo la existencia del select', () => {
    document.body.innerHTML = '<select id="campo"><option value="">Elegí</option></select>'
    expect(campoQaListo(document, 'campo', 'o2')).toBe(false)
    document.getElementById('campo').add(new Option('Electricidad', 'o2'))
    expect(campoQaListo(document, 'campo', 'o2')).toBe(true)
  })
  it('no selecciona opciones deshabilitadas', () => {
    document.body.innerHTML = '<select id="campo"><option value="2" disabled>Inactivo</option></select>'
    expect(campoQaListo(document, 'campo', 2)).toBe(false)
    document.querySelector('option').disabled = false
    expect(campoQaListo(document, 'campo', 2)).toBe(true)
  })
  it('no cambia el driver gráfico local por defecto', () => {
    expect(argumentosGraficosQa(false)).toEqual([])
  })
  it('selecciona el driver software documentado sin desactivar el sandbox', () => {
    expect(argumentosGraficosQa(true)).toEqual(['--use-gl=angle', '--use-angle=swiftshader'])
  })
})
