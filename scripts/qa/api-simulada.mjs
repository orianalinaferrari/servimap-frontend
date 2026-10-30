import { randomBytes } from 'node:crypto'
// Datos exclusivamente sintéticos. Nunca se envían a una API real.
export const idQA = (numero) => `00000000-0000-4000-8000-${String(numero).padStart(12, '0')}`
export const API_SIMULADA_ORIGIN = 'https://servimap-backend.vercel.app'
export function politicaDeRed({ url, method }) {
  if (new URL(url).origin === API_SIMULADA_ORIGIN) return 'simular'
  return ['GET', 'HEAD'].includes(method) ? 'lectura' : 'bloquear'
}
export const CUENTAS_QA = {
  CLIENTE: { email: 'cliente@example.test', password: randomBytes(32).toString('hex') },
  PRESTADOR: { email: 'prestador@example.test', password: randomBytes(32).toString('hex') },
  ADMINISTRADOR: { email: 'admin@example.test', password: randomBytes(32).toString('hex') },
}
const respuesta = (status, body) => ({ status, body })
const fallo = (status, error) => respuesta(status, { error })
const tokenQA = (usuario, segundos) => `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: usuario.id, rol: usuario.rol, exp: Math.floor(Date.now() / 1000) + segundos })).toString('base64url')}.firma-fixture-no-valida-en-produccion`

export function crearApiSimulada({ perfilesAdicionales = [] } = {}) {
  const usuarios = Object.entries(CUENTAS_QA).map(([rol, datos], indice) => ({ ...datos, id: idQA(indice + 1), nombre: `QA ${rol}`, dni: `1234567${indice}`, rol }))
  const oficios = [{ id: idQA(201), nombre: 'Plomería', categoria: 'Hogar', activo: true }, { id: idQA(202), nombre: 'Electricidad', categoria: 'Hogar', activo: true }]
  const perfil = { id: idQA(101), nombre: 'QA PRESTADOR', email: CUENTAS_QA.PRESTADOR.email, descripcionProfesional: 'Servicios para pruebas locales.', fotoPerfil: null, zonaCobertura: 'Centro', latitud: null, longitud: null, precioMin: null, precioMax: null, telefono: null, whatsapp: null, emailContacto: null, disponible: true, oficioIds: [oficios[0].id] }
  const solicitudes = [], calificaciones = [], errores = [], llamadas = []
  let contador = 0, siguienteTTL = 3600
  const usuarioPublico = ({ id, nombre, email, rol }) => ({ id, nombre, email, rol })
  const perfiles = [perfil, ...perfilesAdicionales]
  const perfilPropio = (dato = perfil) => ({ ...dato, oficioIds: undefined, oficios: oficios.filter((o) => dato.oficioIds.includes(o.id)).map(({ id, nombre }) => ({ id, nombre })) })
  const reputacion = () => ({ promedio: calificaciones.length ? Math.round(calificaciones.reduce((s, c) => s + c.puntaje, 0) / calificaciones.length * 10) / 10 : null, totalCalificaciones: calificaciones.length, serviciosFinalizados: solicitudes.filter((s) => s.estado === 'FINALIZADA').length })
  const comentarios = () => calificaciones.filter((c) => !c.moderada).map(({ id, puntaje, comentario, fechaPublicacion }) => ({ id, puntaje, comentario, fechaPublicacion }))
  function resumen(dato = perfil) {
    const p = perfilPropio(dato)
    const publico = { ...p }
    for (const campo of ['email', 'telefono', 'whatsapp', 'emailContacto']) delete publico[campo]
    return { ...publico, latitud: p.latitud == null ? null : Number(p.latitud.toFixed(2)), longitud: p.longitud == null ? null : Number(p.longitud.toFixed(2)), oficios: p.oficios.filter((o) => oficios.find((item) => item.id === o.id)?.activo), reputacion: dato === perfil ? reputacion() : { promedio: null, totalCalificaciones: 0, serviciosFinalizados: 0 } }
  }
  const autenticado = (headers) => {
    try {
      const authorization = Object.entries(headers).find(([nombre]) => nombre.toLowerCase() === 'authorization')?.[1]
      const [tipo, token] = (authorization || '').split(' ')
      if (tipo !== 'Bearer' || !token.endsWith('.firma-fixture-no-valida-en-produccion')) return null
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
      return payload.exp > Date.now() / 1000 ? usuarios.find((u) => u.id === payload.sub && u.rol === payload.rol) : null
    } catch { return null }
  }
  function detallada(s) {
    return { ...s, oficio: oficios.find((o) => o.id === s.oficioId), cliente: { id: s.clienteId, nombre: usuarios.find((u) => u.id === s.clienteId)?.nombre }, prestador: { id: s.prestadorId, nombre: perfiles.find((p) => p.id === s.prestadorId)?.nombre }, calificada: calificaciones.some((c) => c.solicitudId === s.id) }
  }
  function resolver({ method = 'GET', url, headers = {}, body }) {
    const ruta = new URL(url).pathname, query = new URL(url).searchParams
    const forzado = errores.findIndex((e) => e.method === method && e.path === ruta)
    if (forzado >= 0) { const [e] = errores.splice(forzado, 1); return fallo(e.status, `Error simulado ${e.status}`) }
    if (method === 'OPTIONS') return respuesta(204, null)
    if (ruta === '/health' && method === 'GET') return respuesta(200, { status: 'ok' })
    if (ruta === '/api/auth/register' && method === 'POST') {
      const { nombre, email, password, rol } = body || {}, dni = String(body?.dni || '').replace(/[.\s]/g, '')
      if (!nombre?.trim() || !/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email || '') || !/^\d{7,8}$/.test(dni) || typeof password !== 'string' || password.length < 8 || !['CLIENTE', 'PRESTADOR'].includes(rol)) return fallo(400, 'Datos inválidos')
      if (usuarios.some((u) => u.email === email.toLowerCase() || u.dni === dni)) return fallo(409, 'DNI o email duplicado')
      const nuevo = { id: idQA(10 + usuarios.length), nombre, email: email.toLowerCase(), password, dni, rol }
      usuarios.push(nuevo); return respuesta(201, usuarioPublico(nuevo))
    }
    if (ruta === '/api/auth/login' && method === 'POST') {
      const usuario = usuarios.find((u) => u.email === body?.email && u.password === body?.password)
      if (!usuario) return fallo(401, 'Email o contraseña incorrectos')
      const ttl = siguienteTTL; siguienteTTL = 3600
      return respuesta(200, { usuario: usuarioPublico(usuario), token: tokenQA(usuario, ttl) })
    }
    if (ruta === '/api/oficios' && method === 'GET') return respuesta(200, oficios.filter((o) => o.activo))
    if (ruta === '/api/prestadores' && method === 'GET') {
      const q = (query.get('q') || '').toLocaleLowerCase('es')
      return respuesta(200, perfiles.map(resumen).filter((p) => (!query.get('oficioId') || p.oficios.some((o) => o.id === query.get('oficioId'))) && (!q || [p.nombre, p.zonaCobertura, ...p.oficios.map((o) => o.nombre)].some((s) => (s || '').toLocaleLowerCase('es').includes(q))) && (!query.has('disponible') || p.disponible === (query.get('disponible') === 'true')) && (!query.has('calificacionMin') || p.reputacion.promedio >= Number(query.get('calificacionMin')))))
    }
    if (ruta === '/api/prestadores/mapa' && method === 'GET') {
      return respuesta(200, perfiles.map(resumen).filter((p) => p.disponible && p.latitud != null && p.longitud != null && p.oficios.length).map((p) => ({ id: p.id, nombre: p.nombre, latitud: p.latitud, longitud: p.longitud, oficioPrincipal: p.oficios[0].nombre, promedio: p.reputacion.promedio })))
    }
    const ficha = perfiles.find((p) => ruta === `/api/prestadores/${p.id}`)
    if (ficha && method === 'GET') return respuesta(200, { ...resumen(ficha), telefono: ficha.telefono, whatsapp: ficha.whatsapp, emailContacto: ficha.emailContacto, comentarios: ficha === perfil ? comentarios() : [] })
    const usuario = autenticado(headers)
    if (!usuario) return fallo(401, 'Token no proporcionado, inválido o vencido')
    if (ruta === '/api/auth/me' && method === 'GET') return respuesta(200, { ...usuarioPublico(usuario), dni: usuario.dni })
    if (ruta.startsWith('/api/prestadores/me')) {
      if (usuario.rol !== 'PRESTADOR') return fallo(403, 'Solo prestadores')
      if (ruta === '/api/prestadores/me/calificaciones' && method === 'GET') return respuesta(200, comentarios())
      if (ruta === '/api/prestadores/me' && method === 'GET') return respuesta(200, perfilPropio())
      if (ruta === '/api/prestadores/me' && method === 'PUT') {
        for (const key of ['descripcionProfesional', 'telefono', 'whatsapp', 'emailContacto']) if (key in body && !body[key]?.trim()) return fallo(400, `Campo ${key} vacío`)
        for (const key of ['telefono', 'whatsapp']) if (key in body && !/^\+?\d[\d\s()-]{5,19}$/.test(body[key])) return fallo(400, 'Contacto inválido')
        if ('emailContacto' in body && !body.emailContacto.includes('@')) return fallo(400, 'Email inválido')
        if ('latitud' in body && Math.abs(body.latitud) > 90 || 'longitud' in body && Math.abs(body.longitud) > 180) return fallo(400, 'Coordenadas inválidas')
        Object.assign(perfil, body); return respuesta(200, perfilPropio())
      }
      if (ruta === '/api/prestadores/me/oficios' && method === 'PUT') {
        if (!Array.isArray(body?.oficioIds) || body.oficioIds.some((id) => !oficios.some((o) => o.id === id && o.activo))) return fallo(400, 'Oficios inválidos')
        perfil.oficioIds = [...new Set(body.oficioIds)]; return respuesta(200, perfilPropio())
      }
    }
    if (ruta === '/api/solicitudes' && method === 'GET') {
      if (!['CLIENTE', 'PRESTADOR'].includes(usuario.rol)) return fallo(403, 'Sin permisos')
      return respuesta(200, solicitudes.filter((s) => usuario.rol === 'PRESTADOR' ? s.prestadorId === perfil.id : s.clienteId === usuario.id).slice().reverse().map(detallada))
    }
    if (ruta === '/api/solicitudes' && method === 'POST') {
      if (usuario.rol !== 'CLIENTE') return fallo(403, 'Solo clientes')
      const destinatario = perfiles.find((p) => p.id === body?.prestadorId)
      if (!destinatario) return fallo(404, 'Prestador no encontrado')
      if (!destinatario.disponible) return fallo(409, 'Prestador no disponible')
      if (!destinatario.oficioIds.includes(body.oficioId) || !body.descripcion?.trim() || body.descripcion.length > 1000 || !oficios.some((o) => o.id === body.oficioId && o.activo)) return fallo(400, 'Datos inválidos')
      const nueva = { ...body, id: idQA(400 + ++contador), clienteId: usuario.id, estado: 'PENDIENTE', fechaCreacion: new Date().toISOString() }
      solicitudes.push(nueva); return respuesta(201, nueva)
    }
    const accion = ruta.match(/^\/api\/solicitudes\/([^/]+)\/(aceptar|rechazar|finalizar|cancelar)$/)
    if (accion && method === 'PATCH') {
      const s = solicitudes.find((s) => s.id === accion[1]); if (!s) return fallo(404, 'Solicitud no encontrada')
      const [, , nombre] = accion, cliente = nombre === 'cancelar'
      if (cliente ? usuario.rol !== 'CLIENTE' || s.clienteId !== usuario.id : usuario.rol !== 'PRESTADOR' || s.prestadorId !== perfil.id) return fallo(403, 'Solicitud ajena')
      if (cliente ? !['PENDIENTE', 'ACEPTADA'].includes(s.estado) : s.estado !== (nombre === 'finalizar' ? 'ACEPTADA' : 'PENDIENTE')) return fallo(409, 'Estado incompatible')
      s.estado = { aceptar: 'ACEPTADA', rechazar: 'RECHAZADA', finalizar: 'FINALIZADA', cancelar: 'CANCELADA' }[nombre]
      return respuesta(200, s)
    }
    if (ruta === '/api/calificaciones' && method === 'POST') {
      if (usuario.rol !== 'CLIENTE') return fallo(403, 'Solo clientes')
      const s = solicitudes.find((s) => s.id === body?.solicitudId); if (!s) return fallo(404, 'Solicitud no encontrada')
      if (s.clienteId !== usuario.id) return fallo(403, 'Solicitud ajena')
      if (s.estado !== 'FINALIZADA' || calificaciones.some((c) => c.solicitudId === s.id)) return fallo(409, 'Solicitud no calificable')
      if (!Number.isInteger(body.puntaje) || body.puntaje < 1 || body.puntaje > 5 || (body.comentario || '').length > 500) return fallo(400, 'Calificación inválida')
      const c = { ...body, id: idQA(500 + calificaciones.length), clienteId: usuario.id, prestadorId: perfil.id, moderada: false, fechaPublicacion: new Date().toISOString() }
      calificaciones.push(c); return respuesta(201, c)
    }
    if (usuario.rol !== 'ADMINISTRADOR') return fallo(403, 'Solo administración')
    if (ruta === '/api/calificaciones' && method === 'GET') return respuesta(200, calificaciones)
    const moderacion = ruta.match(/^\/api\/calificaciones\/([^/]+)\/moderacion$/)
    if (moderacion && method === 'PATCH') {
      const c = calificaciones.find((c) => c.id === moderacion[1]); if (!c) return fallo(404, 'Calificación no encontrada')
      if (c.moderada) return fallo(409, 'Ya moderada')
      if (!body?.motivo?.trim() || body.motivo.length > 200) return fallo(400, 'Motivo inválido')
      Object.assign(c, { moderada: true, motivoModeracion: body.motivo, fechaModeracion: new Date().toISOString() }); return respuesta(200, c)
    }
    if (ruta === '/api/oficios/todos' && method === 'GET') return respuesta(200, oficios)
    if (ruta === '/api/oficios' && method === 'POST') {
      if (!body?.nombre?.trim()) return fallo(400, 'Nombre obligatorio')
      if (oficios.some((o) => o.nombre === body.nombre)) return fallo(409, 'Nombre duplicado')
      const o = { id: idQA(201 + oficios.length), ...body, activo: true }; oficios.push(o); return respuesta(201, o)
    }
    const oficio = ruta.match(/^\/api\/oficios\/([^/]+)(\/estado)?$/)
    if (oficio && ['PUT', 'PATCH'].includes(method)) {
      const o = oficios.find((o) => o.id === oficio[1]); if (!o) return fallo(404, 'Oficio no encontrado')
      if (method === 'PATCH' && typeof body?.activo !== 'boolean') return fallo(400, 'Estado inválido')
      Object.assign(o, body); return respuesta(200, o)
    }
    return fallo(404, 'Ruta no simulada')
  }
  return {
    perfil, solicitudes, calificaciones, oficios, llamadas,
    expirarSiguienteLogin: () => { siguienteTTL = 2 },
    forzarError: (method, path, status) => errores.push({ method, path, status }),
    responder: (request) => {
      const result = resolver(request)
      llamadas.push({ method: request.method, path: new URL(request.url).pathname, status: result.status })
      return JSON.parse(JSON.stringify(result))
    },
  }
}
