import { crearDemoPrestador } from './prestador-datos.mjs'
import { idQA } from './api-simulada.mjs'

export function crearDemoCliente(escenario = 'completo') {
  if (!['completo', 'vacio', 'errores'].includes(escenario)) throw new Error('Escenario válido: completo, vacio o errores.')
  const extras = [
    { id: idQA(102), nombre: 'QA Lucía Demo — Pintura', zonaCobertura: 'Nueva Córdoba', descripcionProfesional: 'Pintura de interiores. Perfil ficticio sin coordenadas.', oficioIds: [idQA(203)], disponible: true, latitud: null, longitud: null, precioMin: 20000, precioMax: 60000, telefono: null, whatsapp: null, emailContacto: 'pintura@example.test' },
    { id: idQA(103), nombre: 'QA Pablo Demo — Electricidad', zonaCobertura: 'General Paz', descripcionProfesional: 'Instalaciones eléctricas. Perfil completamente ficticio.', oficioIds: [idQA(202)], disponible: false, latitud: -31.41123, longitud: -64.16678, precioMin: 18000, precioMax: 40000, telefono: null, whatsapp: null, emailContacto: null },
  ]
  const api = crearDemoPrestador('completo', { perfilesAdicionales: escenario === 'vacio' ? [] : extras })
  // Una finalizada queda sin calificar para recorrer el formulario existente.
  api.calificaciones.splice(0, 1)
  if (escenario === 'vacio') {
    api.solicitudes.splice(0); api.calificaciones.splice(0)
    api.perfil.disponible = false; api.perfil.latitud = null; api.perfil.longitud = null
  }
  if (escenario === 'errores') {
    // Solo falla el próximo envío de cada acción; el reintento funciona.
    api.forzarError('POST', '/api/solicitudes', 409)
    api.forzarError('PATCH', `/api/solicitudes/${idQA(601)}/cancelar`, 409)
    api.forzarError('POST', '/api/calificaciones', 400)
  }
  return api
}
