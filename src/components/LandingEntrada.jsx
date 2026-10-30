import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/LandingEntrada.css'

function IconoRol({ prestador }) {
  return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {prestador ? <><rect x="4" y="10" width="24" height="17" rx="4" /><path d="M11 10V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3M4 17a30 30 0 0 0 24 0M14 17h4v5h-4z" /></> : <><circle cx="16" cy="10" r="5" /><path d="M6 28v-3a10 10 0 0 1 20 0v3" /></>}
  </svg>
}

function Ciudad() {
  return <img className="landing-ciudad" src="/illustrations/servimap-ciudad.svg" alt="" aria-hidden="true" />
}

export default function LandingEntrada() {
  const [explicando, setExplicando] = useState(false)
  const dialogo = useRef(null)
  const abrirExplicacion = useRef(null)
  useEffect(() => {
    if (explicando) dialogo.current.showModal()
    else if (dialogo.current.open) dialogo.current.close()
  }, [explicando])
  return <section className="landing-entrada" aria-label="Bienvenida a ServiMap">
    <img className="landing-panel" src="/illustrations/servimap-panel.svg" alt="" aria-hidden="true" />
    <svg className="landing-geometria" viewBox="0 0 1600 813" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <g stroke="#E5E2DD" strokeWidth="2" opacity=".55"><path d="M780 75 1600 310M830 315 1600 65M840 565 1600 380M820 665 1600 535M960 0 1120 813M1515 0 1595 813" /></g>
      <g stroke="#E9E7E1" strokeWidth="12" opacity=".24"><path d="M800 150 1600 395M845 615 1600 460M1010 0 1205 813" /></g>
      <g fill="#EAE9E3" opacity=".45"><path d="m917 42 78 52-47 79-78-52zM1357 155l104 39-38 103-104-39z" /></g>
      <g fill="#D5A0B1" opacity=".8"><circle cx="1443" cy="110" r="10" /><circle cx="955" cy="395" r="11" /><circle cx="1511" cy="692" r="11" /></g>
    </svg>
    <header className="landing-cabecera">
      <Link className="landing-marca" to="/" aria-label="ServiMap, inicio">ServiMap</Link>
      <nav aria-label="Navegación principal">
        <button ref={abrirExplicacion} type="button" onClick={() => setExplicando(true)}>Cómo funciona</button>
        <Link to="/prestadores">Explorar servicios</Link>
      </nav>
    </header>
    <div className="landing-presentacion">
      <div className="landing-mensaje">
        <p className="landing-antetitulo">Servicios cerca tuyo</p>
        <h1>Lo que necesitás,<br />más cerca de vos.</h1>
        <p>Conectamos personas que necesitan ayuda con quienes saben cómo resolverlo.</p>
      </div>
      <Ciudad />
    </div>
    <div className="landing-eleccion">
      <h2>¿Qué querés hacer hoy?</h2>
      <p className="landing-subtitulo">Elegí cómo empezar en ServiMap.</p>
      <div className="landing-tarjetas">
        {[
          { rol: 'CLIENTE', titulo: 'Crear cuenta cliente', descripcion: 'Creá tu cuenta como cliente y encontrá servicios cerca tuyo.', boton: 'Empezar como cliente' },
          { rol: 'PRESTADOR', titulo: 'Ofrecer mis servicios', descripcion: 'Mostrá tu oficio y conectá con nuevos clientes.', boton: 'Empezar como prestador' },
        ].map(({ rol, titulo, descripcion, boton }) => <article className="landing-tarjeta" key={rol}>
          <div className={`landing-icono ${rol === 'PRESTADOR' ? 'landing-icono-rosa' : ''}`}><IconoRol prestador={rol === 'PRESTADOR'} /></div>
          <div className="landing-tarjeta-contenido">
            <h3><Link to={`/registro?rol=${rol}`}>{titulo}</Link></h3>
            <p>{descripcion}</p>
            <Link className="landing-boton" to={`/registro?rol=${rol}`}>{boton}<span aria-hidden="true">→</span></Link>
          </div>
        </article>)}
      </div>
      <p className="landing-login">¿Ya tenés una cuenta? <Link to="/login">Iniciá sesión</Link></p>
    </div>
    <dialog ref={dialogo} className="landing-dialogo" aria-labelledby="como-funciona-titulo" onCancel={() => setExplicando(false)} onClose={() => { setExplicando(false); abrirExplicacion.current?.focus() }} onClick={(evento) => {
      if (evento.target !== dialogo.current) return
      const r = dialogo.current.getBoundingClientRect()
      if (evento.clientX < r.left || evento.clientX > r.right || evento.clientY < r.top || evento.clientY > r.bottom) setExplicando(false)
    }}>
      <div className="landing-dialogo-titulo"><h2 id="como-funciona-titulo">Cómo funciona ServiMap</h2><button type="button" aria-label="Cerrar explicación" onClick={() => setExplicando(false)} autoFocus>×</button></div>
      <h3>Como cliente</h3><p>Explorá los servicios, creá tu cuenta y enviá una solicitud a un profesional. Cuando el trabajo finalice, calificá tu experiencia.</p>
      <h3>Como prestador</h3><p>Registrate, completá tu perfil y tus oficios. Recibí solicitudes de clientes y gestioná tus trabajos desde tu panel.</p>
    </dialog>
  </section>
}
