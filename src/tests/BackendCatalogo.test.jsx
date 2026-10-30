import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import DirectorioPrestadores from '../components/DirectorioPrestadores'
import { listarPrestadores, listarMarcadores, obtenerPrestador } from '../services/prestadoresService'
import { BASE, instalarHttp, respuesta } from './helpers/contratos'
vi.mock('../components/mapa/MapaPrestadores',()=>({ MapaPrestadores:({prestadores,onSeleccionar})=><section aria-label="Ubicaciones públicas">{prestadores.map((p)=><button key={p.id} onClick={()=>onSeleccionar(p.id)}>{`Marcador ${p.id}: ${p.latitud}, ${p.longitud}`}</button>)}</section> }))
const publico={id:'p1',nombre:'Profesional público',oficios:[{id:'o1',nombre:'Plomero'}],zonaCobertura:'Centro',precioMin:null,precioMax:null,disponible:true,latitud:-34.12,longitud:-58.12,reputacion:{promedio:4.5,serviciosFinalizados:2}}
let http
beforeEach(()=>{
  vi.stubEnv('VITE_API_URL',BASE)
  http=instalarHttp((url)=>{
    if(url.pathname==='/api/oficios')return respuesta([{id:'o1',nombre:'Plomero',activo:true}])
    if(url.pathname==='/api/prestadores/mapa')return respuesta([{id:'p1',nombre:publico.nombre,oficioPrincipal:'Plomero',latitud:-34.12,longitud:-58.12,promedio:4.5}])
    if(url.pathname==='/api/prestadores/p1')return respuesta({...publico,comentarios:[{id:'c1',puntaje:5,comentario:'Comentario remoto',fechaPublicacion:'2026-10-29T10:00:00Z'}],telefono:null})
    if(url.pathname==='/api/prestadores')return respuesta([publico])
  })
})
afterEach(()=>{cleanup();vi.unstubAllEnvs()})
describe('Directorio, ficha y mapa reales',()=>{
  it('adapta oficios por ID y reputación sin inventar precios',async()=>{
    const lista=await listarPrestadores();expect(lista[0]).toMatchObject({oficios:['Plomero'],oficiosCatalogo:[{id:'o1',nombre:'Plomero'}],calificacionPromedio:4.5,trabajosFinalizados:2,precioMin:null})
    expect(new URL(http.mock.calls[0][0]).searchParams.get('limit')).toBe('50')
    expect(http.mock.calls[0][1].headers?.Authorization).toBeUndefined()
  })
  it('envía filtros reales oficioId, q y disponible',async()=>{
    await listarPrestadores({oficioId:'o1',q:'Centro',disponible:true})
    const query=new URL(http.mock.calls[0][0]).searchParams
    expect(query.get('oficioId')).toBe('o1');expect(query.get('q')).toBe('Centro');expect(query.get('disponible')).toBe('true');expect(query.has('oficio')).toBe(false)
  })
  it('consume mapa público independientemente del perfil privado',async()=>{
    const lista=await listarMarcadores();expect(lista[0]).toMatchObject({latitud:-34.12,longitud:-58.12,oficios:['Plomero']})
    expect(new URL(http.mock.calls[0][0]).pathname).toBe('/api/prestadores/mapa')
    expect(http.mock.calls.some(([url])=>url.includes('/me'))).toBe(false)
  })
  it('abre ficha real desde el marcador y admite precios/contactos nulos',async()=>{
    render(<DirectorioPrestadores/>);fireEvent.click(await screen.findByRole('button',{name:/Marcador p1/}));expect(await screen.findByText('Comentario remoto')).toBeInTheDocument();expect(screen.getByRole('button',{name:'Solicitar servicio'})).toBeInTheDocument();expect(screen.queryByRole('link',{name:'WhatsApp'})).toBeNull()
  })
  it('un fallo del mapa conserva el directorio y ofrece reintento',async()=>{
    http.mockImplementation(async(url)=>new URL(url).pathname.endsWith('/mapa')?respuesta({error:'Mapa no disponible'},500):new URL(url).pathname==='/api/oficios'?respuesta([{id:'o1',nombre:'Plomero'}]):respuesta([publico]))
    render(<DirectorioPrestadores/>);expect(await screen.findByRole('button',{name:publico.nombre})).toBeInTheDocument();expect(screen.getByRole('alert')).toHaveTextContent('Mapa no disponible')
  })
  it('busca por el catálogo completo con IDs reales',async()=>{
    render(<DirectorioPrestadores/>);await screen.findByRole('button',{name:publico.nombre});fireEvent.change(screen.getByLabelText('Oficio'),{target:{value:'Plomero'}})
    await waitFor(()=>expect(http.mock.calls.some(([url])=>new URL(url).searchParams.get('oficioId')==='o1')).toBe(true))
  })
  it('ficha conserva comentarios públicos sin requerir datos del cliente',async()=>{const ficha=await obtenerPrestador('p1');expect(ficha.comentarios[0]).toMatchObject({prestadorId:'p1',comentario:'Comentario remoto'});expect(ficha.comentarios[0].dni).toBeUndefined()})
})
