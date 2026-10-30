import { useState } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom'
import { AuthContext } from '../../context/authContextInstance'
import RutaProtegida from '../../components/auth/RutaProtegida'
import { PanelAdministracion } from '../../components/PanelAdministracion'
import { BuscadorPrestadores } from '../../components/BuscadorPrestadores'
import { calificacionesMock } from '../../data/calificacionesMock'
import { prestadoresMock } from '../../data/prestadoresMock'
import { moderarCalificacion } from '../../utils/reputacion'

export function renderConAdministrador(ruta = '/admin') {
  const usuario = { id: 1, nombre: 'Administrador de prueba', rol: 'ADMINISTRADOR' }
  function VistasConFixtures() {
    const [datos, setDatos] = useState(calificacionesMock)
    return <><Link to="/">Inicio</Link><Routes>
      <Route path="/admin" element={<RutaProtegida rolesPermitidos={['ADMINISTRADOR']}><PanelAdministracion prestadores={prestadoresMock} calificaciones={datos} onModerar={(id, motivo) => setDatos((lista) => moderarCalificacion(lista, id, motivo, '2026-10-29'))} /></RutaProtegida>} />
      <Route path="/" element={<BuscadorPrestadores prestadores={prestadoresMock} calificaciones={datos} />} />
    </Routes></>
  }
  return render(<MemoryRouter initialEntries={[ruta]}><AuthContext.Provider value={{ usuario, autenticado: true, cargando: false }}><VistasConFixtures /></AuthContext.Provider></MemoryRouter>)
}
