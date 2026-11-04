// Datos ficticios solo para tests/QA. No se importan desde rutas productivas.
export const clienteConsulta = { id: 'usuario-cliente-qa', nombre: 'Cliente QA', rol: 'CLIENTE' }
export const prestadorConsulta = { id: 'usuario-prestador-qa', nombre: 'Prestador QA', rol: 'PRESTADOR' }
export const adminConsulta = { id: 'usuario-admin-qa', nombre: 'Administrador QA', rol: 'ADMINISTRADOR' }
export function consultaFixture(datos = {}) {
  return { id: 'consulta-qa-1', autorId: clienteConsulta.id, categoria: 'CUENTA', asunto: 'Consulta ficticia de acceso', mensaje: 'Necesito orientación sobre mi cuenta. Mensaje ficticio.', estado: 'PENDIENTE', fechaCreacion: '2026-11-03T15:00:00.000Z', respuesta: null, ...datos }
}
export function servicioConsultasFixture(usuario, iniciales = [consultaFixture()], administracion = false) {
  let consultas = structuredClone(iniciales)
  return {
    disponible: true,
    async listar({ pagina, limite, estado }) {
      const filtradas = consultas.filter(c => (administracion || c.autorId === usuario.id) && (!estado || c.estado === estado))
      return structuredClone({ datos: filtradas.slice((pagina - 1) * limite, pagina * limite), pagina, total: filtradas.length, totalPaginas: Math.max(1, Math.ceil(filtradas.length / limite)) })
    },
    async obtener(id) { return structuredClone(consultas.find(c => c.id === id)) },
    async crear(datos) { const nueva = consultaFixture({ ...datos, id: `consulta-qa-${consultas.length + 1}`, autorId: usuario.id }); consultas = [nueva, ...consultas]; return structuredClone(nueva) },
    async responder(id, mensaje) {
      consultas = consultas.map(c => c.id === id ? { ...c, estado: 'RESPONDIDA', respuesta: { mensaje, fechaCreacion: '2026-11-03T16:00:00.000Z' } } : c)
      return this.obtener(id)
    },
    async cerrar(id) { consultas = consultas.map(c => c.id === id ? { ...c, estado: 'CERRADA' } : c); return this.obtener(id) },
  }
}
