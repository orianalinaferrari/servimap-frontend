import { Link } from 'react-router-dom'
import { IconoPrestador } from './IconoPrestador'
import { obtenerIniciales } from '../../utils/perfilUsuario'
import { FotoPrestador } from './FotoPrestador'

export function VistaPerfilPrestador({ perfil, onEditar, renderCampo, enviando = false }) {
  const iniciales = obtenerIniciales(perfil.nombre)
  const precio = (valor) => `$ ${valor.toLocaleString('es-AR')}`
  const rango = Number.isFinite(perfil.precioMin) && Number.isFinite(perfil.precioMax) ? `${precio(perfil.precioMin)} – ${precio(perfil.precioMax)}` : Number.isFinite(perfil.precioMin) ? `Desde ${precio(perfil.precioMin)}` : Number.isFinite(perfil.precioMax) ? `Hasta ${precio(perfil.precioMax)}` : 'Sin informar'
  return <>
    <header className="prestador-titulo"><div><h1>Mi perfil</h1><p>Gestioná tu información personal y profesional. Mantené tus datos actualizados para que los clientes puedan contactarte.</p></div><Link to="/prestador">← Volver al panel</Link></header>
    <section className="prestador-identidad">
      <span className="prestador-avatar" aria-hidden="true"><FotoPrestador key={`${perfil.id}:${perfil.fotoPerfil}`} prestador={perfil} respaldo={iniciales || <IconoPrestador tipo="usuario" />} /></span>
      <div><p className="prestador-etiqueta">PRESTADOR</p><h2>{perfil.nombre}</h2><p className="prestador-email"><IconoPrestador tipo="email" />{perfil.email}</p>
        {renderCampo ? renderCampo('descripcionProfesional') : <p>{perfil.descripcionProfesional || 'Sin descripción profesional'}</p>}
        {renderCampo && renderCampo('fotoPerfil')}
      </div>
    </section>
    <div className="prestador-dos-columnas">
      <section className="prestador-tarjeta"><h2><IconoPrestador tipo="telefono" />Información de contacto</h2>
        <dl className="prestador-contactos">{[['telefono','Teléfono','telefono'],['whatsapp','WhatsApp','whatsapp'],['emailContacto','Email de contacto','email']].map(([campo,label,tipo]) => <div key={campo}><span className="prestador-icono-suave"><IconoPrestador tipo={tipo} /></span><div><dt>{label}</dt><dd>{renderCampo ? renderCampo(campo, true) : perfil[campo] || 'Sin informar'}</dd></div></div>)}</dl>
      </section>
      <section className="prestador-tarjeta"><h2><IconoPrestador />Información del servicio</h2>
        <dl className="prestador-servicio">{[['Zona',perfil.zonaCobertura || 'Sin informar','zona'],['Oficios',perfil.oficios.map((oficio) => oficio.nombre).join(', ') || 'Sin oficios asociados','herramienta'],['Rango de precios',rango,'precio'],['Disponibilidad',perfil.disponible ? 'Disponible' : 'No disponible','calendario']].map(([label,valor,tipo]) => <div key={label}><span className="prestador-icono-suave"><IconoPrestador tipo={tipo} /></span><dt>{label}</dt><dd>{renderCampo && tipo === 'zona' ? renderCampo('zonaCobertura') : renderCampo && tipo === 'precio' ? <>{renderCampo('precioMin')}{renderCampo('precioMax')}</> : renderCampo && tipo === 'calendario' ? renderCampo('disponible') : <>{valor}{tipo === 'calendario' && <span className={`prestador-disponibilidad ${perfil.disponible ? 'disponible' : ''}`}><span aria-hidden="true">●</span>{valor}</span>}</>}</dd></div>)}</dl>
        {renderCampo && <div className="prestador-campos"><p>Las coordenadas exactas son privadas. Los campos numéricos vacíos conservan su valor anterior.</p>{renderCampo('latitud')}{renderCampo('longitud')}</div>}
        <Link className="prestador-enlace-oficios" to="/prestador/oficios">Administrar mis oficios</Link>
      </section>
    </div>
    {onEditar && <div className="prestador-acciones"><button type="button" onClick={onEditar} disabled={enviando}><IconoPrestador tipo="editar" />Editar perfil</button></div>}
  </>
}
