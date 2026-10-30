import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { AuthProvider } from '../context/AuthContext'
import { useAuth } from '../context/useAuth'
import { guardarToken, obtenerToken, EVENTO_SESION_EXPIRADA } from '../services/sesionToken'
import { BASE, instalarHttp, respuesta, jwtPrueba } from './helpers/contratos'
function Sesion() {
  const {usuario,cargando,logout,sesionExpirada}=useAuth()
  return <><p>{cargando?'Verificando':usuario?.nombre||'Sin sesión'}</p>{sesionExpirada&&<p>Sesión expirada</p>}<button onClick={logout}>Salir</button></>
}
beforeEach(()=>vi.stubEnv('VITE_API_URL',BASE))
afterEach(()=>{cleanup();vi.unstubAllEnvs();vi.useRealTimers()})
describe('Sesión JWT en React',()=>{
  it('recupera usuario por /me y permite logout local',async()=>{
    guardarToken(jwtPrueba());const http=instalarHttp(()=>respuesta({id:'u1',nombre:'Usuario remoto',rol:'CLIENTE'}));render(<AuthProvider><Sesion/></AuthProvider>);expect(await screen.findByText('Usuario remoto')).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Salir'}));expect(await screen.findByText('Sin sesión')).toBeInTheDocument();expect(obtenerToken()).toBeNull();expect(http).toHaveBeenCalledTimes(1)
  })
  it('oculta datos protegidos cuando recibe el evento de expiración',async()=>{
    guardarToken(jwtPrueba());instalarHttp(()=>respuesta({id:'u1',nombre:'Usuario remoto',rol:'CLIENTE'}));render(<AuthProvider><Sesion/></AuthProvider>);await screen.findByText('Usuario remoto');act(()=>window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA)));expect(screen.getByText('Sin sesión')).toBeInTheDocument();expect(screen.getByText('Sesión expirada')).toBeInTheDocument()
  })
  it('el temporizador elimina una sesión vencida sin esperar otra petición',async()=>{
    vi.useFakeTimers();guardarToken(jwtPrueba(Date.now()/1000+1));instalarHttp(()=>respuesta({id:'u1',nombre:'Usuario remoto',rol:'CLIENTE'}));render(<AuthProvider><Sesion/></AuthProvider>);await act(async()=>{await Promise.resolve();await Promise.resolve()});await act(async()=>vi.advanceTimersByTimeAsync(1200));expect(screen.getByText('Sin sesión')).toBeInTheDocument();expect(screen.getByText('Sesión expirada')).toBeInTheDocument();expect(obtenerToken()).toBeNull()
  })
  it('sin JWT no hace un intento de autenticación en producción',async()=>{
    render(<AuthProvider><Sesion/></AuthProvider>);await waitFor(()=>expect(screen.getByText('Sin sesión')).toBeInTheDocument());expect(fetch).not.toHaveBeenCalled()
  })
})
