import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { IconoPrestador } from '../components/prestador/IconoPrestador'
import { obtenerIniciales } from '../utils/perfilUsuario'

// Solo lectura: Swagger no expone un endpoint para actualizar datos del CLIENTE.
export default function PerfilCliente() {
  const { usuario } = useAuth()
  const iniciales = obtenerIniciales(usuario?.nombre)
  const fecha = usuario?.fechaRegistro ? new Date(usuario.fechaRegistro) : null
  const datos = [
    ['Nombre y apellido', usuario?.nombre, 'usuario'],
    ['Email', usuario?.email, 'email'],
    ['DNI', usuario?.dni, 'documento'],
    ['Miembro desde', fecha && !Number.isNaN(fecha.getTime()) ? fecha.toLocaleDateString('es-AR') : null, 'calendario'],
  ]
  return <main className="prestador-pagina prestador-perfil cliente-perfil">
    <header className="prestador-titulo"><div><h1>Mi perfil</h1><p>Consultá los datos personales de tu cuenta de ServiMap.</p></div><Link to="/cliente">← Volver al panel</Link></header>
    <section className="prestador-identidad">
      <span className="prestador-avatar" aria-hidden="true">{iniciales || <IconoPrestador tipo="usuario" />}</span>
      <div><p className="prestador-etiqueta">CLIENTE</p><h2>{usuario?.nombre || 'Sin nombre registrado'}</h2><p className="prestador-email"><IconoPrestador tipo="email" />{usuario?.email}</p></div>
    </section>
    <section className="prestador-tarjeta"><h2><IconoPrestador tipo="usuario" />Datos personales</h2>
      <dl className="prestador-contactos">{datos.map(([etiqueta, valor, tipo]) => <div key={etiqueta}><span className="prestador-icono-suave"><IconoPrestador tipo={tipo} /></span><div><dt>{etiqueta}</dt><dd>{valor || 'No informado por el servidor'}</dd></div></div>)}</dl>
      <p role="note">Estos datos son de solo lectura y el DNI no se puede modificar. Por ahora el servidor no ofrece una operación para actualizar los datos personales del cliente.</p>
    </section>
  </main>
}
