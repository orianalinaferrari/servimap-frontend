import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom/vitest'
import Registro from '../pages/Registro'
import { BASE, instalarHttp, respuesta } from './helpers/contratos'
beforeEach(()=>vi.stubEnv('VITE_API_URL',BASE))
afterEach(()=>{cleanup();vi.unstubAllEnvs()})
function completar() {
  for(const [label,value] of [['Nombre','Persona Apellido'],['DNI','12.345.678'],['Email','PERSONA@example.test'],['Contraseña','clave1234'],['Confirmar contraseña','clave1234']])fireEvent.change(screen.getByLabelText(label),{target:{value}})
}
describe('Registro conectado al backend',()=>{
  it('conserva rol y normaliza DNI antes de registrar',async()=>{
    const http=instalarHttp(()=>respuesta({id:'u1'},201));render(<MemoryRouter initialEntries={['/registro?rol=PRESTADOR']}><Registro/></MemoryRouter>);completar();fireEvent.click(screen.getByRole('button',{name:'Crear cuenta'}))
    expect(await screen.findByRole('status')).toHaveTextContent('Tu cuenta fue creada')
    expect(JSON.parse(http.mock.calls[0][1].body)).toEqual({nombre:'Persona Apellido',dni:'12345678',email:'persona@example.test',password:'clave1234',rol:'PRESTADOR'})
    expect(screen.getByLabelText('Contraseña')).toHaveValue('')
  })
  it('muestra un DNI duplicado y permite corregir sin perder el formulario',async()=>{
    instalarHttp(()=>respuesta({error:'Ya existe una cuenta con ese DNI'},409));render(<MemoryRouter initialEntries={['/registro?rol=CLIENTE']}><Registro/></MemoryRouter>);completar();fireEvent.click(screen.getByRole('button',{name:'Crear cuenta'}));expect(await screen.findByRole('alert')).toHaveTextContent('DNI');expect(screen.getByLabelText('Nombre')).toHaveValue('Persona Apellido')
  })
  it('rechaza DNI inválido y contraseña corta sin enviar HTTP',async()=>{
    render(<MemoryRouter initialEntries={['/registro?rol=CLIENTE']}><Registro/></MemoryRouter>);completar();fireEvent.change(screen.getByLabelText('DNI'),{target:{value:'abc'}});fireEvent.change(screen.getByLabelText('Contraseña'),{target:{value:'123'}});fireEvent.click(screen.getByRole('button',{name:'Crear cuenta'}));expect(screen.getByText('El DNI debe tener 7 u 8 números')).toBeInTheDocument();expect(fetch).not.toHaveBeenCalled()
  })
})
