export function IconoPrestador({ tipo = 'oficio', className = '' }) {
  const paths = {
    usuario: 'M20 22v-2a8 8 0 0 0-16 0v2M17 7A5 5 0 1 1 7 7a5 5 0 0 1 10 0Z',
    oficio: 'M3 7h18v14H3ZM8 7V3h8v4M3 12h18M10 12v3h4v-3',
    herramienta: 'M14 6a6 6 0 0 0-7 8L2 19a2 2 0 0 0 3 3l6-6a6 6 0 0 0 8-7l-4 4-4-4 4-4Z',
    telefono: 'M5 2h4l2 6-3 2a14 14 0 0 0 6 6l2-3 6 2v4c-1 7-22-9-17-17Z',
    email: 'M2 4h20v16H2ZM2 5l10 8L22 5',
    whatsapp: 'M21 11a9 9 0 0 1-9 9 10 10 0 0 1-4-1l-6 3 2-6a9 9 0 1 1 17-5ZM8 7c0 5 3 8 7 8l1-2-3-1-1 1-2-3 1-1-2-3Z',
    zona: 'M12 22s8-8 8-14a8 8 0 0 0-16 0c0 6 8 14 8 14ZM15 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    precio: 'M12 2v20M18 6c-7-5-15 4-5 6s2 12-7 6',
    documento: 'M3 5h18v14H3ZM7 10h5M7 14h7M15 9h3v4h-3Z',
    calendario:'M3 5h18v17H3ZM7 2v6M17 2v6M3 10h18',
    estrella: 'm12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z',
    editar: 'm3 16 13-13 5 5-13 13H3v-5ZM13 6l5 5',
    quitar: 'M3 6h18M9 6V2h6v4M5 6l1 16h12l1-16M10 10v8M14 10v8',
    agregar: 'M12 3v18M3 12h18',
    solicitudes: 'M8 4H4v18h16V4h-4M8 2h8v5H8ZM8 12h8M8 17h8',
    electricidad: 'm14 2-11 12h8l-1 8 11-13h-8l1-7Z',
  }
  return <svg className={`prestador-icono ${className}`} width="24" height="24" viewBox="0 0 24 24" fill={tipo === 'estrella' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[tipo] ?? paths.oficio} /></svg>
}
