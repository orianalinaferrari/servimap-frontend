import { useState } from 'react'

const SECCIONES = [
  { id: 'comentarios', nombre: 'Moderación de comentarios' },
  { id: 'oficios', nombre: 'Administración de oficios' },
]

export function PanelAdministracion() {
  const [seccionActiva, setSeccionActiva] = useState('comentarios')

  return (
    <section>
      <h2>Panel de administración</h2>

      <nav aria-label="Secciones de administración">
        {SECCIONES.map((seccion) => (
          <button
            key={seccion.id}
            type="button"
            aria-pressed={seccionActiva === seccion.id}
            onClick={() => setSeccionActiva(seccion.id)}
          >
            {seccion.nombre}
          </button>
        ))}
      </nav>

      {seccionActiva === 'comentarios' && <p>Próximamente: moderación de comentarios.</p>}
      {seccionActiva === 'oficios' && <p>Próximamente: administración de oficios.</p>}
    </section>
  )
}