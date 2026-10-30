import { Link } from 'react-router-dom'
import { IconoPrestador } from './IconoPrestador'

export function VistaPerfilPrestador({ perfil, onEditar }) {
  const iniciales = (perfil.nombre || '').split(/[\s—]+/).filter(Boolean).slice(-2).map((palabra) => palabra[0]).join('')
  const precio = (valor) => `$ ${valor.toLocaleString('es-AR')}`
  const rango = Number.isFinite(perfil.precioMin) && Number.isFinite(perfil.precioMax) ? `${precio(perfil.precioMin)} – ${precio(perfil.precioMax)}` : Number.isFinite(perfil.precioMin) ? `Desde ${precio(perfil.precioMin)}` : Number.isFinite(perfil.precioMax) ? `Hasta ${precio(perfil.precioMax)}` : 'Sin informar'
  return <>
    <header className="prestador-titulo"><div><h1>Mi perfil</h1><p>Gestioná tu información personal y profesional. Mantené tus datos actualizados para que los clientes puedan contactarte.</p></div><Link to="/prestador">← Volver al panel</Link></header>
    <section className="prestador-identidad">
      <span className="prestador-avatar" aria-hidden="true">{iniciales || <IconoPrestador tipo="usuario" />}</span>
      <div><p className="prestador-etiqueta">PRESTADOR</p><h2>{perfil.nombre}</h2><p className="prestador-email"><IconoPrestador tipo="email" />{perfil.email}</p><p>{perfil.descripcionProfesional || 'Sin descripción profesional'}</p></div>
      <button onClick={onEditar}><IconoPrestador tipo="editar" />Editar perfil</button>
    </section>
    <div className="prestador-dos-columnas">
      <section className="prestador-tarjeta"><h2><IconoPrestador tipo="telefono" />Información de contacto</h2>
        <dl className="prestador-contactos">{[['telefono','Teléfono','telefono'],['whatsapp','WhatsApp','whatsapp'],['emailContacto','Email de contacto','email']].map(([campo,label,tipo]) => <div key={campo}><span className="prestador-icono-suave"><IconoPrestador tipo={tipo} /></span><div><dt>{label}</dt><dd>{perfil[campo] || 'Sin informar'}</dd></div></div>)}</dl>
      </section>
      <section className="prestador-tarjeta"><h2><IconoPrestador />Información del servicio</h2>
        <dl className="prestador-servicio">{[['Zona',perfil.zonaCobertura || 'Sin informar','zona'],['Oficios',perfil.oficios.map((oficio) => oficio.nombre).join(', ') || 'Sin oficios asociados','herramienta'],['Rango de precios',rango,'precio'],['Disponibilidad',perfil.disponible ? 'Disponible' : 'No disponible','calendario']].map(([label,valor,tipo]) => <div key={label}><span className="prestador-icono-suave"><IconoPrestador tipo={tipo} /></span><dt>{label}</dt><dd>{valor}{tipo === 'calendario' && <span className={`prestador-disponibilidad ${perfil.disponible ? 'disponible' : ''}`}><span aria-hidden="true">●</span>{valor}</span>}</dd></div>)}</dl>
        <Link className="prestador-enlace-oficios" to="/prestador/oficios">Administrar mis oficios</Link>
      </section>
    </div>
  </>
}
