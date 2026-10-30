import { crearApiSimulada, idQA } from './api-simulada.mjs'

export function crearDemoPrestador(escenario = 'completo', opciones) {
  if (!['completo', 'incompleto', 'vacio'].includes(escenario)) throw new Error('Escenario válido: completo, incompleto o vacio.')
  const api = crearApiSimulada(opciones)
  api.perfil.nombre = 'QA PRESTADOR — Martín Demo'
  api.oficios.push({ id: idQA(203), nombre: 'Pintura', categoria: 'Hogar', activo: true })
  api.oficios.push({ id: idQA(204), nombre: 'Oficio inactivo QA', categoria: 'QA', activo: false })
  if (escenario !== 'incompleto') Object.assign(api.perfil, {
    descripcionProfesional: 'DEMO QA: instalaciones y reparaciones domiciliarias. Información completamente ficticia.',
    zonaCobertura: 'Córdoba Capital — Centro y Nueva Córdoba (QA)',
    telefono: '+54 000 000 0000', whatsapp: '+540000000000', emailContacto: 'prestador@example.test',
    precioMin: 12000, precioMax: 45000, latitud: -31.417123, longitud: -64.183456,
    oficioIds: [idQA(201), idQA(202)],
  })
  else Object.assign(api.perfil, { descripcionProfesional: null, zonaCobertura: '', oficioIds: [], disponible: false })
  if (escenario === 'completo') {
    const datos = [
      ['PENDIENTE', 'Revisión de pérdida de agua en cocina (QA).', 201],
      ['PENDIENTE', 'Instalación de luminaria en comedor (QA).', 202],
      ['ACEPTADA', 'Reparación de canilla coordinada con el cliente (QA).', 201],
      ['FINALIZADA', 'Cambio de tomacorriente completado (QA).', 202],
      ['RECHAZADA', 'Trabajo fuera de la zona de cobertura (QA).', 201],
      ['CANCELADA', 'Pedido cancelado por el cliente (QA).', 202],
      ['FINALIZADA', 'Mantenimiento preventivo terminado (QA).', 201],
    ]
    datos.forEach(([estado, descripcion, oficio], indice) => api.solicitudes.push({
      id: idQA(601 + indice), clienteId: idQA(1), prestadorId: api.perfil.id,
      oficioId: idQA(oficio), estado, descripcion, fechaCreacion: `2026-10-${String(29 - indice).padStart(2, '0')}T10:00:00Z`,
      direccion: `Domicilio ficticio QA ${indice + 1}, Córdoba Capital`, contactoPreferido: 'cliente@example.test (dato ficticio)',
    }))
    api.calificaciones.push(
      { id: idQA(701), solicitudId: idQA(604), clienteId: idQA(1), prestadorId: api.perfil.id, puntaje: 5, comentario: 'QA: trabajo puntual y prolijo. Reseña ficticia.', moderada: false, fechaPublicacion: '2026-10-28T15:00:00Z' },
      { id: idQA(702), solicitudId: idQA(607), clienteId: idQA(1), prestadorId: api.perfil.id, puntaje: 4, comentario: 'QA: buena atención. Reseña ficticia.', moderada: false, fechaPublicacion: '2026-10-27T15:00:00Z' },
    )
  }
  return api
}
