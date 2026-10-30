export function IconoAdministracion({ tipo = 'comentario', className = '' }) {
  const trazos = {
    comentario: 'M21 11a9 9 0 0 1-9 9 10 10 0 0 1-4-1l-6 3 2-6a9 9 0 1 1 17-5Z',
    oculto: 'm3 3 18 18M10 5a14 14 0 0 1 12 7 17 17 0 0 1-4 5M6 6a18 18 0 0 0-4 6s4 7 10 7a13 13 0 0 0 5-1M9 9a4 4 0 0 0 6 6',
    usuario: 'M20 22v-2a8 8 0 0 0-16 0v2M17 7A5 5 0 1 1 7 7a5 5 0 0 1 10 0Z',
    configuracion: 'm10 2-1 3-3 1-3-1-2 4 2 2v3l-2 2 2 4 3-1 3 1 1 3h4l1-3 3-1 3 1 2-4-2-2v-3l2-2-2-4-3 1-3-1-1-3h-4ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
    estrella: 'm12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z',
  }
  return <svg className={`admin-icono ${className}`} width="24" height="24" viewBox="0 0 24 24" fill={tipo === 'estrella' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={trazos[tipo]} /></svg>
}
