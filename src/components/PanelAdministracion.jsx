import { useState } from 'react'
import { ModeracionComentarios } from './ModeracionComentarios'
import { AdministracionOficios } from './AdministracionOficios'

const SECCIONES = [
  { id: 'comentarios', nombre: 'Moderación de comentarios' },
  { id: 'oficios', nombre: 'Administración de oficios' },
]

export function PanelAdministracion({
  prestadores = [],
  calificaciones = [],
  onModerar = () => {},
}) {
  const [seccionActiva, setSeccionActiva] = useState('comentarios')

  return (
    <section className="panel">
      <h2>Panel de administración</h2>

      <nav className="panel-nav" aria-label="Secciones de administración">
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

      {seccionActiva === 'comentarios' && (
        <ModeracionComentarios
          prestadores={prestadores}
          calificaciones={calificaciones}
          onModerar={onModerar}
        />
      )}
      {seccionActiva === 'oficios' && <AdministracionOficios />}
    </section>
  )
}
