const formatoArgentina = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  timeZone: 'America/Argentina/Buenos_Aires',
})
const formatoCalendario = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC',
})

export function formatearFechaArgentina(valor) {
  // Un instante requiere zona explícita; no depender del huso del navegador.
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(valor)) return 'No disponible'
  const dia = valor.slice(0, 10)
  const calendario = new Date(`${dia}T00:00:00Z`)
  // Date normaliza días imposibles (por ejemplo 30 de febrero); rechazarlos.
  if (!Number.isFinite(calendario.getTime()) || calendario.toISOString().slice(0, 10) !== dia) return 'No disponible'
  if (valor.length === 10) return formatoCalendario.format(calendario)
  const instante = new Date(valor)
  return Number.isFinite(instante.getTime()) ? formatoArgentina.format(instante) : 'No disponible'
}
