// Solo se tolera un ID vencido cuando Chrome confirmó que canceló esa petición.
export function esIntercepcionCancelada(error, networkId, canceladas) {
  return error?.message === 'Invalid InterceptionId.' && Boolean(networkId) && canceladas.has(networkId)
}

export async function esperarPuertoChrome(leer, { timeoutMs = 10000, intervaloMs = 50 } = {}) {
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
  throw new Error('Chrome no expuso un puerto CDP utilizable.', { cause: ultimoError })
}
