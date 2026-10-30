import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { PanelAdministracion } from '../components/PanelAdministracion'
import { registrarCalificacion, editarComentario } from '../services/calificacionesService'
import { BASE, instalarHttp, respuesta } from './helpers/contratos'
beforeEach(()=>vi.stubEnv('VITE_API_URL',BASE))
afterEach(()=>{cleanup();vi.unstubAllEnvs()})
describe('Calificaciones y moderación reales',()=>{
  it('califica con solicitudId, puntaje y comentario en POST /api/calificaciones',async()=>{
    const http=instalarHttp(()=>respuesta({id:'c1',puntaje:5},201));await registrarCalificacion('s1',{puntaje:5,comentario:' Muy bien '});expect(http.mock.calls[0][0]).toBe(BASE+'/api/calificaciones');expect(JSON.parse(http.mock.calls[0][1].body)).toEqual({solicitudId:'s1',puntaje:5,comentario:'Muy bien'})
  })
  it('respeta el límite de 500 caracteres sin llamar al servidor',()=>{
    expect(()=>registrarCalificacion('s1',{puntaje:5,comentario:'x'.repeat(501)})).toThrow('500');expect(fetch).not.toHaveBeenCalled()
  })
  it.each([403,404,409])('no considera registrada una calificación rechazada HTTP %s',async(status)=>{
    instalarHttp(()=>respuesta({error:'Solicitud no calificable'},status));await expect(registrarCalificacion('s1',{puntaje:5,comentario:''})).rejects.toMatchObject({status})
  })
  it('edita comentarios por el endpoint real sin cambiar puntaje',async()=>{
    const http=instalarHttp(()=>respuesta({id:'c1'}));await editarComentario('c1','Comentario corregido');expect(http.mock.calls[0][0]).toBe(BASE+'/api/calificaciones/c1/comentario');expect(JSON.parse(http.mock.calls[0][1].body)).toEqual({comentario:'Comentario corregido'})
  })
  it('modera por PATCH, conserva datos del servidor y muestra nombres ausentes como IDs',async()=>{
    const inicial={id:'c1',prestadorId:'p1',clienteId:'u1',puntaje:3,comentario:'Texto a moderar',moderada:false}
    const http=instalarHttp((url,config)=>config.method==='PATCH'?respuesta({...inicial,moderada:true,motivoModeracion:JSON.parse(config.body).motivo}):respuesta([inicial]))
    render(<PanelAdministracion/>);fireEvent.click(await screen.findByRole('button',{name:'Ocultar comentario de Cliente u1'}));fireEvent.change(screen.getByLabelText('Motivo de la moderación'),{target:{value:'Motivo válido'}});fireEvent.click(screen.getByRole('button',{name:'Confirmar'}));expect(await screen.findByText('Motivo: Motivo válido')).toBeInTheDocument();expect(http.mock.calls.find(([,config])=>config.method==='PATCH')[0]).toBe(BASE+'/api/calificaciones/c1/moderacion')
  })
  it('una moderación rechazada conserva el comentario publicado y no confirma éxito',async()=>{
    const inicial={id:'c1',prestadorId:'p1',clienteId:'u1',puntaje:3,comentario:'Texto publicado',moderada:false}
    instalarHttp((url,config)=>config.method==='PATCH'?respuesta({error:'Sin permisos para moderar'},403):respuesta([inicial]))
    render(<PanelAdministracion/>);fireEvent.click(await screen.findByRole('button',{name:'Ocultar comentario de Cliente u1'}));fireEvent.change(screen.getByLabelText('Motivo de la moderación'),{target:{value:'Motivo'}});fireEvent.click(screen.getByRole('button',{name:'Confirmar'}));expect(await screen.findByRole('alert')).toHaveTextContent('Sin permisos');expect(screen.getByText('Texto publicado')).toBeInTheDocument();expect(within(screen.getByRole('button',{name:'Confirmar'}).closest('form')).getByLabelText('Motivo de la moderación')).toHaveValue('Motivo')
  })
})
