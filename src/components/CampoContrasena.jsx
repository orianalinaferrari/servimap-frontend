import { useState } from 'react'
import './CampoContrasena.css'

export default function CampoContrasena(props) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="campo-contrasena">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        className="contrasena-toggle"
        type="button"
        aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${props.id === 'confirmarContrasena' ? 'confirmación de contraseña' : 'contraseña'}`}
        aria-pressed={visible}
        aria-controls={props.id}
        onClick={() => setVisible((anterior) => !anterior)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="m3 3 18 18" />}
        </svg>
      </button>
    </div>
  )
}
