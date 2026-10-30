// Solo se tolera un ID vencido cuando Chrome confirmó que canceló esa petición.
export function esIntercepcionCancelada(error, networkId, canceladas) {
  return error?.message === 'Invalid InterceptionId.' && Boolean(networkId) && canceladas.has(networkId)
}
