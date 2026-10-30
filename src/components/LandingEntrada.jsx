import { Link } from 'react-router-dom'
import '../styles/LandingEntrada.css'

function IconoRol({ prestador }) {
  return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {prestador ? <><rect x="4" y="10" width="24" height="17" rx="4" /><path d="M11 10V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3M4 17a30 30 0 0 0 24 0M14 17h4v5h-4z" /></> : <><circle cx="16" cy="10" r="5" /><path d="M6 28v-3a10 10 0 0 1 20 0v3" /></>}
  </svg>
}

function Ciudad() {
  return <svg className="landing-ciudad" viewBox="0 0 460 270" fill="none" aria-hidden="true">
    <circle cx="352" cy="55" r="29" fill="#C98D9B" opacity=".85" />
    <g stroke="#F8F5EF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 248h412M51 248V127l69-30v151M51 127l69 19M139 248V62l81-30 63 30v186M139 62l81 28 63-28M220 90v158M303 248V135l68-24 47 24v113M303 135l68 23 47-23M371 158v90" fill="#F8F5EF" fillOpacity=".04" />
      <path d="M74 147v17m22-9v17m-22 14v17m22-9v17m-22 14v17m22-9v17M160 91v16m22-9v16m-22 12v16m22-9v16m-22 12v16m22-9v16m-22 12v16m22-9v16M242 103v16m21-24v16m-21 26v16m21-24v16m-21 26v16m21-24v16m-21 26v16m21-24v16M325 159v16m23-8v16m-23 12v16m23-8v16m45-57v16m0 17v16" opacity=".6" />
      <path d="M178 248v-29l20 7v22M333 248v-20l16 5v15" />
      <path d="M32 248v-31m-10-2c-12-26 6-43 10-43s23 17 11 43c-3 9-18 9-21 0ZM431 248v-32m-10-2c-10-23 6-39 10-39s20 16 10 39c-3 8-17 8-20 0Z" fill="#C98D9B" />
    </g>
    <path d="m96 64 5-9 5 9-5 9zM309 87h12m-6-6v12" stroke="#C98D9B" strokeWidth="2" />
  </svg>
}

export default function LandingEntrada() {
  return <section className="landing-entrada" aria-label="Bienvenida a ServiMap">
    <div className="landing-presentacion">
      <div className="landing-mensaje">
        <p className="landing-etiqueta">Servicios cerca tuyo</p>
        <h1>Lo que necesitás,<br />más cerca de vos</h1>
        <p>Conectamos personas con profesionales de confianza para hacer tu día a día más fácil.</p>
      </div>
      <Ciudad />
    </div>
    <div className="landing-eleccion">
      <span className="landing-decoracion" aria-hidden="true">✧</span>
      <h2>¿Qué querés hacer hoy?</h2>
      <p className="landing-subtitulo">Elegí cómo empezar en ServiMap.</p>
      <div className="landing-tarjetas">
        {[
          { rol: 'CLIENTE', titulo: 'Encontrar un profesional', descripcion: 'Creá tu cuenta como cliente y encontrá servicios cerca tuyo', boton: 'Empezar como cliente' },
          { rol: 'PRESTADOR', titulo: 'Ofrecer mis servicios', descripcion: 'Registrate como prestador, publicá tu oficio y conectá con clientes', boton: 'Empezar como prestador' },
        ].map(({ rol, titulo, descripcion, boton }) => <article className="landing-tarjeta" key={rol}>
          <div className={`landing-icono ${rol === 'PRESTADOR' ? 'landing-icono-rosa' : ''}`}><IconoRol prestador={rol === 'PRESTADOR'} /></div>
          <div className="landing-tarjeta-contenido">
            <h3>{titulo}</h3>
            <p>{descripcion}</p>
            <Link className="landing-boton" to={`/registro?rol=${rol}`}>{boton}<span aria-hidden="true">→</span></Link>
          </div>
        </article>)}
      </div>
      <p className="landing-login">¿Ya tenés una cuenta? <Link to="/login">Iniciá sesión</Link></p>
    </div>
  </section>
}
