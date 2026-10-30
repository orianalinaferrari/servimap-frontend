// Solo se tolera un ID vencido cuando Chrome confirmó que canceló esa petición.
export function esIntercepcionCancelada(error, networkId, canceladas) {
  return error?.message === 'Invalid InterceptionId.' && Boolean(networkId) && canceladas.has(networkId)
}

export function campoQaListo(documento, id, valor) {
  const campo = documento.getElementById(id)
  return Boolean(campo && !campo.disabled && (campo.tagName !== 'SELECT' ||
    [...campo.options].some(opcion => opcion.value === String(valor) && !opcion.disabled)))
}

export function argumentosGraficosQa(software) {
  // SwANGLE as GLES driver for GPU-less test hosts; keep the Chrome sandbox.
  return software ? ['--use-gl=angle', '--use-angle=swiftshader'] : []
}

export async function esperarPuertoChrome(leer, { timeoutMs = 10000, intervaloMs = 50, diagnostico = () => '' } = {}) {
  const limite = Date.now() + timeoutMs
  let ultimoError
  do {
    try {
      const [puerto, socket] = leer().trim().split(/\r?\n/)
      const numero = Number(puerto)
      if (Number.isInteger(numero) && numero > 0 && numero <= 65535 && socket?.startsWith('/devtools/browser/')) return numero
    } catch (error) {
      if (!['ENOENT', 'EBUSY'].includes(error.code)) throw error
      ultimoError = error
    }
    await new Promise(resolve => setTimeout(resolve, intervaloMs))
  } while (Date.now() < limite)
  const detalle = diagnostico().trim()
  throw new Error(`Chrome no expuso un puerto CDP utilizable.${detalle ? ` Stderr de Chrome: ${detalle}` : ''}`, { cause: ultimoError })
}

// /json/list puede responder antes de registrar la pestaña inicial en hosts lentos.
export async function esperarPaginaCdp(listar, { timeoutMs = 10000, intervaloMs = 100 } = {}) {
  const limite = Date.now() + timeoutMs
  let ultimoError
  do {
    try {
      const pagina = (await listar()).find((t) => t.type === 'page' && t.url === 'about:blank' && t.webSocketDebuggerUrl)
      if (pagina) return pagina
    } catch (error) {
      ultimoError = error
    }
    await new Promise(resolve => setTimeout(resolve, intervaloMs))
  } while (Date.now() < limite)
  throw new Error('Chrome no expuso una pestaña CDP inicial.', { cause: ultimoError })
}

// Lecturas reales por defecto; el modo local es explícito, solo QA y solo loopback.
export function configuracionLecturasQa(env = process.env) {
  if (!env.SERVIMAP_QA_LECTURAS_API) return { local: false, api: 'https://servimap-backend.vercel.app', web: 'http://localhost:5173' }
  const api = new URL(env.SERVIMAP_QA_LECTURAS_API), web = new URL(env.SERVIMAP_QA_BASE_URL || 'http://localhost:5173')
  if (![api, web].every((url) => url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname))) {
    throw new Error('El modo local de lecturas solo admite orígenes http de loopback.')
  }
  return { local: true, api: api.origin, web: web.origin }
}
