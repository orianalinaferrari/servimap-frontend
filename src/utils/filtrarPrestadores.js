export function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function filtrarPrestadores(prestadores, termino) {
  const terminoLimpio = normalizar(termino.trim())

  if (terminoLimpio === '') {
    return prestadores
  }
  return prestadores.filter((prestador) =>
    normalizar(prestador.nombre).includes(terminoLimpio) ||
    normalizar(prestador.zonaCobertura).includes(terminoLimpio) ||
    prestador.oficios.some((oficio) => normalizar(oficio).includes(terminoLimpio))
  )
}