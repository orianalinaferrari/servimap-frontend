# Preguntas frecuentes y ayudas breves

Rama `feature/faqs-ayuda`, creada desde `main` actualizado (`b987c970930f312a987ccafb607d52281053668d`), después de verificar que el PR #33 estaba fusionado. Árbol inicialmente limpio. Trabajo local, sin commit, push ni PR.

## Alcance

Ruta pública `/ayuda`, accesible desde inicio, navegación de todos los roles y encabezado de login/registro. Diez preguntas desplegables con `details`/`summary`, agrupadas para ambos roles, clientes y prestadores. Dos tooltips explican precio de referencia y ubicación aproximada; funcionan con puntero, foco y toque, se cierran con Escape o al salir del control. Los enlaces llevan a recorridos existentes y conservan sus controles de acceso.

No se cambian formularios, servicios HTTP, autenticación, estados, reglas de negocio ni backend. Solo se agregan accesos de navegación y se permite que la navegación de inicio se ajuste al nuevo enlace en pantallas pequeñas.

## Fuentes comprobadas el 2 de noviembre de 2026

Se contrastaron las pantallas reales y sus servicios/utilidades del frontend con el Swagger público desplegado (`GET /api-docs/swagger-ui-init.js`) y el código del backend en el commit `a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c`. No se enviaron escrituras al backend ni se utilizaron cuentas reales.

| Tema | Evidencia del frontend | Contrato / implementación de la API |
| --- | --- | --- |
| Cancelación | `SolicitudesCliente.jsx`, `estadosSolicitud.js` | `PATCH /api/solicitudes/{id}/cancelar`: cliente dueño; Pendiente o Aceptada |
| Aceptar/rechazar | `SolicitudesPrestador.jsx`, `estadosSolicitud.js` | `PATCH /api/solicitudes/{id}/aceptar` y `/rechazar`: prestador dueño; Pendiente |
| Finalización | `SolicitudesPrestador.jsx`, `finalizacionSolicitud.js` | `PATCH /api/solicitudes/{id}/finalizar`: prestador dueño; Aceptada → Finalizada; sin confirmación del cliente |
| Calificar | `SolicitudesCliente.jsx`, `calificacionSolicitud.js` | `POST /api/calificaciones`: cliente dueño; solicitud Finalizada; una calificación por solicitud |
| Búsqueda y filtros | `BuscadorPrestadores.jsx`, `filtrosPrestadores.js`, `prestadoresService.js` | `GET /api/prestadores`, `/api/oficios`, `/api/prestadores/mapa`; zona y precio también se filtran sobre los resultados recibidos |
| Perfil y oficios | `PerfilPrestador.jsx`, `FormularioPerfilPrestador.jsx`, `OficiosPrestador.jsx` | `PUT /api/prestadores/me`, `PUT /api/prestadores/me/oficios`: catálogo activo; la lista enviada reemplaza la anterior |
| Inicio de sesión | `Login.jsx`, `authService.js` | Login con email/contraseña; errores de credenciales y cuenta desactivada; sin ruta de recuperación |
| Pagos, disputas y reversión | Pantallas, servicios y rutas de la aplicación | No hay operaciones de cobro, reembolso, reclamo, disputa ni reversión de Finalizada en los contratos/rutas revisados |

Referencias del backend, solo lectura:

- [Solicitudes](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/src/services/solicitudesService.js)
- [Calificaciones](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/src/services/calificacionesService.js)
- [Perfil, oficios y búsqueda](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/src/services/prestadoresService.js)
- [Rutas de acceso](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/src/routes/authRouter.js)
- [Contrato Swagger](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/src/config/swagger.js)

## Límites que comunica la ayuda

- La plataforma no verifica la realización efectiva del trabajo ni pide al cliente confirmar su finalización. No hay reversión, tampoco desde el panel de administración. Contactar al prestador o calificar no reabre la solicitud.
- Pagos acordados entre las partes fuera de ServiMap; precios orientativos. Sin cobros, reembolsos ni gestión de disputas.
- No hay recuperación de contraseña ni reactivación de cuentas desde la ayuda. No se inventa un canal de soporte.
- Los filtros no garantizan un presupuesto: precio máximo compara contra el mínimo publicado; sin precio/calificación informados, el resultado se excluye al aplicar el filtro respectivo. La búsqueda muestra el conjunto recibido de la API; no se promete un listado exhaustivo ni orden por cercanía.
- La foto usa una URL pública. Nombre y email de la cuenta no son editables desde el formulario profesional. Los cambios de oficios requieren Guardar oficios.
- La revisión se basa en UI, código y contratos publicados; no certifica nuevos recorridos autenticados en producción ni altera su funcionamiento.

## Validación reproducible

No se encontró Node 24 en PATH ni en las ubicaciones habituales de nvm, fnm, Volta o Scoop. Se utiliza Node `v26.13.0`, sin cambiar `.nvmrc`, `engines`, dependencias ni configuración.

- `npm test`: suite completa, incluyendo 14 pruebas nuevas de ayuda, acceso por rol, navegación, preguntas desplegables, contenido y tooltips accesibles.
- `npm run lint`.
- `npm run build`: conserva la advertencia por chunks mayores a 500 kB.
- `node scripts/qa/faqs-ayuda.mjs` después del build: 40 comprobaciones en Chrome headless del artefacto de producción local. Teclado Enter/Espacio, foco visible, semántica accesible, Escape, toque, navegación, acceso directo y tamaños 320, 390, 768, 1024 y 1365 px, sin desbordamiento de FAQs ni tooltips.
- `git diff --check`.

El runner de navegador bloquea peticiones externas y escrituras. Las capturas y el reporte se guardan en una carpeta temporal `servimap-qa-ayuda-*`, fuera del repositorio. No se publica ningún despliegue.
