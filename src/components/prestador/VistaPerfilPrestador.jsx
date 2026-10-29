import { Link } from 'react-router-dom'

export function VistaPerfilPrestador({ perfil, onEditar }) {
  return <section>
    <h1>Mi perfil</h1><h2>{perfil.nombre}</h2><p>{perfil.email}</p>
    <p>{perfil.descripcionProfesional || 'Sin descripción profesional'}</p>
    <dl>{[['zonaCobertura','Zona'],['telefono','Teléfono'],['whatsapp','WhatsApp'],['emailContacto','Email de contacto'],['precioMin','Precio mínimo'],['precioMax','Precio máximo']].map(([campo,label])=><div key={campo}><dt>{label}</dt><dd>{perfil[campo] ?? 'Sin informar'}</dd></div>)}</dl>
    <p>{perfil.disponible ? 'Disponible' : 'No disponible'}</p>
    <p>Oficios: {perfil.oficios.map((oficio) => oficio.nombre).join(', ') || 'Sin oficios asociados'}</p>
    <button onClick={onEditar}>Editar perfil</button>{' '}<Link to="/prestador/oficios">Administrar mis oficios</Link>
  </section>
}
