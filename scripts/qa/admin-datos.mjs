// Fixture de la demo ADMINISTRADOR: solo datos en memoria, sin acceso a producción.
import { crearApiSimulada, idQA } from './api-simulada.mjs'

export function crearDemoAdmin() {
  const api = crearApiSimulada()
  api.oficios[0].nombre = 'QA Plomería'
  api.oficios[1].nombre = 'QA Electricidad'
  api.oficios[1].activo = false
  api.oficios.push({ id: idQA(203), nombre: 'QA Pintura', categoria: 'Prueba', activo: true })
  api.calificaciones.push(
    { id: idQA(301), prestadorId: api.perfil.id, clienteId: idQA(1), clienteNombre: 'QA Cliente ficticio A', puntaje: 2, comentario: 'QA: comentario ficticio para practicar moderación.', moderada: false },
    { id: idQA(302), prestadorId: api.perfil.id, clienteId: idQA(2), clienteNombre: 'QA Cliente ficticio B', puntaje: 5, comentario: 'QA: segunda experiencia completamente simulada.', moderada: false },
    { id: idQA(303), prestadorId: api.perfil.id, clienteId: idQA(3), clienteNombre: 'QA Cliente ficticio C', puntaje: 1, comentario: 'QA: ejemplo oculto previamente.', moderada: true, motivoModeracion: 'QA: ejemplo de moderación previa' },
  )
  return api
}
