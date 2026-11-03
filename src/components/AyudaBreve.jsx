import { useId, useState } from 'react'

export default function AyudaBreve({ etiqueta, children }) {
  const id = useId()
  const [visible, setVisible] = useState(false)

  return (
    <span
      className="ayuda-breve"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={(evento) => {
        if (!evento.currentTarget.contains(document.activeElement)) setVisible(false)
      }}
    >
      <button
        type="button"
        aria-label={`Ayuda sobre ${etiqueta.toLowerCase()}`}
        aria-describedby={visible ? id : undefined}
        onFocus={() => setVisible(true)}
        onClick={() => setVisible(true)}
        onBlur={(evento) => {
          if (!evento.currentTarget.parentElement.contains(evento.relatedTarget)) setVisible(false)
        }}
        onKeyDown={(evento) => {
          if (evento.key === 'Escape') setVisible(false)
        }}
      >
        {etiqueta} <span aria-hidden="true">?</span>
      </button>
      {visible && <span className="ayuda-breve-texto" role="tooltip" id={id}>{children}</span>}
    </span>
  )
}
