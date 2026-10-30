import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { obtenerMiPerfil, actualizarMiPerfil } from '../services/prestadoresService'
import { FormularioPerfilPrestador } from '../components/prestador/FormularioPerfilPrestador'
import { IconoPrestador } from '../components/prestador/IconoPrestador'
import { camposPendientesPrestador } from '../utils/perfilUsuario'

export default function CompletarPerfilPrestador() {
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let activo = true
    obtenerMiPerfil().then((dato) => { if (activo) { setPerfil(dato); setError('') } }).catch((fallo) => { if (activo) setError(fallo.message) })
    return () => { activo = false }
  }, [revision])
  async function guardar(datos) {
    await actualizarMiPerfil(datos)
    await navigate('/prestador', { replace: true })
  }
  const pendientes = camposPendientesPrestador(perfil)
  return <main className="prestador-pagina prestador-perfil prestador-completar">
    <header className="prestador-titulo"><div><h1>Completar mi perfil</h1><p>Sumá los datos que los clientes necesitan para encontrarte y contactarte. Podés hacerlo ahora o más tarde desde Mi perfil.</p></div><Link to="/prestador">Ir al panel</Link></header>
    {error && <div role="alert"><p>{error}</p><button onClick={() => setRevision((n) => n + 1)}>Reintentar perfil</button></div>}
    {!perfil && !error && <p role="status">Cargando perfil...</p>}
    {perfil && <section className="prestador-tarjeta"><h2><IconoPrestador tipo="solicitudes" />Datos pendientes</h2>
      {pendientes.length ? <ul>{pendientes.map((pendiente) => <li key={pendiente}>{pendiente}</li>)}</ul> : <p>Tu perfil profesional ya está completo.</p>}
      {perfil.oficios.length === 0 && <Link className="prestador-enlace-oficios" to="/prestador/oficios">Elegir mis oficios</Link>}
    </section>}
    {perfil && <FormularioPerfilPrestador perfil={perfil} titulo={null} textoCancelar="Completar más tarde" onGuardar={guardar} onCancelar={() => navigate('/prestador')} />}
  </main>
}
