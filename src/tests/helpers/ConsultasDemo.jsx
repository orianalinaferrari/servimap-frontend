// Entrada exclusiva del servidor de QA. No forma parte del build productivo.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../../context/authContextInstance'
import CentroConsultas from '../../components/consultas/CentroConsultas'
import { adminConsulta, clienteConsulta, consultaFixture, prestadorConsulta, servicioConsultasFixture } from './consultasFixtures'
import '../../styles/ServiMapIdentidad.css'

const usuarios = { CLIENTE: clienteConsulta, PRESTADOR: prestadorConsulta, ADMINISTRADOR: adminConsulta }
const datos = [consultaFixture(), consultaFixture({ id: 'consulta-prestador-qa', autorId: prestadorConsulta.id, asunto: 'Consulta ficticia del prestador' })]
const servicios = Object.fromEntries(Object.entries(usuarios).map(([rol, usuario]) => [rol, servicioConsultasFixture(usuario, datos, rol === 'ADMINISTRADOR')]))

export default function DemoConsultas() {
  const [rol, setRol] = useState('CLIENTE')
  const usuario = usuarios[rol]
  return <MemoryRouter><AuthContext.Provider value={{ usuario, cargando: false }}>
    <main style={{ maxWidth: 960, margin: 'auto', padding: 16 }}>
      <h1>QA del centro de consultas</h1>
      <p role="note">DEMO QA — datos ficticios, sesiones de prueba y mensajes solo en memoria. No contacta el backend ni guarda datos reales.</p>
      <label htmlFor="qa-rol-consultas">Rol de prueba</label>
      <select id="qa-rol-consultas" value={rol} onChange={e => setRol(e.target.value)}>{Object.keys(usuarios).map(valor => <option key={valor}>{valor}</option>)}</select>
      <CentroConsultas servicio={servicios[rol]} administracion={rol === 'ADMINISTRADOR'} />
    </main>
  </AuthContext.Provider></MemoryRouter>
}
createRoot(document.getElementById('root')).render(<DemoConsultas />)
