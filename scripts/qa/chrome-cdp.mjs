// Arranque compartido de Chrome/Edge headless para los runners QA; nunca descarga navegadores.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
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

async function cerrarChromeFallido(proceso) {
  if (proceso.exitCode !== null || proceso.signalCode !== null) return
  const terminar = (signal) => {
    if (process.platform === 'win32') proceso.kill(signal)
    else {
      try { process.kill(-proceso.pid, signal) } // Grupo propio creado con detached; no afecta otros navegadores.
      catch (error) { if (error.code !== 'ESRCH') throw error }
    }
  }
  await new Promise((resolve, reject) => {
    const limpiar = () => { clearTimeout(forzar); clearTimeout(limite); proceso.removeListener('close', alCerrar) }
    const alCerrar = () => { limpiar(); resolve() }
    const forzar = setTimeout(() => { try { terminar('SIGKILL') } catch (error) { limpiar(); reject(error) } }, 1000)
    const limite = setTimeout(() => { limpiar(); reject(new Error('Chrome no terminó tras SIGTERM/SIGKILL; no se inicia otro proceso.')) }, 2000)
    proceso.once('close', alCerrar)
    try { terminar('SIGTERM') } catch (error) { limpiar(); reject(error) }
  })
}

export async function abrirChromeCdp(carpeta, { timeoutMs = TIMEOUT_ARRANQUE_CDP_MS } = {}) {
  const chrome = resolverNavegadorQa()
  assert.ok(chrome, 'No hay Chrome/Edge instalado; no se descarga ningún navegador')
  const fallos = []
  for (let intento = 1; intento <= 2; intento++) {
    const perfil = mkdtempSync(path.join(carpeta, 'perfil-'))
    const args = argumentosChromeQa(perfil, process.env.SERVIMAP_QA_SOFTWARE_GL === '1')
    const proceso = spawn(chrome, args, { detached: process.platform !== 'win32', windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] })
    const inicio = Date.now()
    let fallo, diagnostico = ''
    proceso.once('error', (error) => { fallo = error })
    proceso.stderr.on('data', (chunk) => { diagnostico = (diagnostico + chunk).slice(-65536) })
    try {
      const puerto = await esperarPuertoChrome(() => {
        if (fallo) throw new Error('No se pudo ejecutar Chrome.', { cause: fallo })
        if (proceso.exitCode !== null || proceso.signalCode !== null) {
          throw new Error(`Chrome terminó antes de exponer CDP (exit ${proceso.exitCode}, signal ${proceso.signalCode}): ${diagnostico}`)
        }
        return readFileSync(path.join(perfil, 'DevToolsActivePort'), 'utf8')
      }, { timeoutMs, diagnostico: () => diagnostico })
      const pagina = await esperarPaginaCdp(async () => (await fetch(`http://127.0.0.1:${puerto}/json/list`, { signal: AbortSignal.timeout(timeoutMs) })).json(), { timeoutMs })
      return { proceso, puerto, pagina }
    } catch (original) {
      // También comprobar eventos ocurridos durante la última pausa del polling.
      const error = fallo ? new Error('No se pudo ejecutar Chrome.', { cause: fallo })
        : original.code === 'QA_CDP_PUERTO_TIMEOUT' && (proceso.exitCode !== null || proceso.signalCode !== null)
          ? new Error(`Chrome terminó antes de exponer CDP (exit ${proceso.exitCode}, signal ${proceso.signalCode}): ${diagnostico}`, { cause: original }) : original
      let cierre
      try { await cerrarChromeFallido(proceso) }
      catch (errorCierre) { cierre = errorCierre }
      const registro = { intento, chrome, args, perfil, pid: proceso.pid, plataforma: process.platform, node: process.version, duracionMs: Date.now() - inicio, exitCode: proceso.exitCode, signalCode: proceso.signalCode, error: error.message, codigo: error.code, causa: error.cause?.code, cierre: cierre?.message, stderr: diagnostico }
      const dir = path.join(process.env.SERVIMAP_QA_DIAGNOSTICOS || carpeta, 'chrome-cdp', path.basename(carpeta))
      mkdirSync(dir, { recursive: true })
      const archivo = path.join(dir, `intento-${intento}.json`)
      writeFileSync(archivo, JSON.stringify(registro, null, 2))
      fallos.push(error)
      const reintentar = intento === 1 && error.code === 'QA_CDP_PUERTO_TIMEOUT' && !cierre
      console.error(JSON.stringify({ chromeCdp: 'arranque fallido', intento, reintentar, diagnostico: archivo }))
      if (!reintentar) {
        if (cierre) throw new AggregateError([...fallos, cierre], 'Chrome falló y no pudo cerrarse correctamente; revisar diagnósticos.', { cause: original })
        if (fallos.length > 1) throw new AggregateError(fallos, 'Chrome no inició CDP en los dos intentos; revisar diagnósticos de arranque.', { cause: original })
        throw error
      }
    }
  }
}
