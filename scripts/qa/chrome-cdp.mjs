// Arranque compartido de Chrome/Edge headless para los runners QA; nunca descarga navegadores.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { argumentosGraficosQa, esperarPaginaCdp, esperarPuertoChrome } from './protocolo-cdp.mjs'

const RUTAS_NAVEGADOR = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/chromium', '/usr/bin/google-chrome']

// El primer arranque de Chrome con SwANGLE en runners Linux compartidos puede superar 10 s.
export const TIMEOUT_ARRANQUE_CDP_MS = 30000

export function resolverNavegadorQa(existe = existsSync, preferido = process.env.SERVIMAP_QA_BROWSER) {
  return [preferido, ...RUTAS_NAVEGADOR].find((ruta) => ruta && existe(ruta))
}

export function argumentosChromeQa(perfil, software = false) {
  return ['--headless=new', ...argumentosGraficosQa(software), '--remote-debugging-port=0', `--user-data-dir=${perfil}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-background-networking', '--disable-sync', 'about:blank']
}

export async function abrirChromeCdp(carpeta, { timeoutMs = TIMEOUT_ARRANQUE_CDP_MS } = {}) {
  const chrome = resolverNavegadorQa()
  assert.ok(chrome, 'No hay Chrome/Edge instalado; no se descarga ningún navegador')
  const perfil = path.join(carpeta, 'perfil')
  const proceso = spawn(chrome, argumentosChromeQa(perfil, process.env.SERVIMAP_QA_SOFTWARE_GL === '1'), { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] })
  let fallo, diagnostico = ''
  proceso.once('error', (error) => { fallo = error })
  proceso.stderr.on('data', (chunk) => { diagnostico = (diagnostico + chunk).slice(-2000) })
  try {
    const puerto = await esperarPuertoChrome(() => {
      if (fallo) throw fallo
      if (proceso.exitCode !== null || proceso.signalCode !== null) {
        throw new Error(`Chrome terminó antes de exponer CDP (exit ${proceso.exitCode}, signal ${proceso.signalCode}): ${diagnostico}`)
      }
      return readFileSync(path.join(perfil, 'DevToolsActivePort'), 'utf8')
    }, { timeoutMs, diagnostico: () => diagnostico })
    const pagina = await esperarPaginaCdp(async () => (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json(), { timeoutMs })
    return { proceso, puerto, pagina }
  } catch (error) {
    proceso.kill()
    throw error
  }
}
