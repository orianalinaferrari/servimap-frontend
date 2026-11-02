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

## Corrección de cobertura del PR #34

El análisis remoto del commit `c4a96cf` reportó 13,5 % de cobertura nueva (mínimo 80 %). Las métricas públicas de SonarCloud permiten identificar la causa:

| Fuente nueva | Líneas nuevas a cubrir / sin cubrir | Condiciones nuevas / sin cubrir | Cobertura Sonar del archivo |
| --- | --- | --- | --- |
| `src/pages/PreguntasFrecuentes.jsx` | 5 / 0 | 0 / 0 | 100 % |
| `src/components/AyudaBreve.jsx` | 11 / 0 | 10 / 2 | 90,5 % |
| `scripts/qa/faqs-ayuda.mjs` | 111 / 111 | 41 / 41 | 0 % |

Las dos condiciones pendientes del componente estaban en las líneas 15 (blur hacia un elemento del propio conjunto) y 18 (tecla distinta de Escape). Todo el código ejecutable nuevo del runner, entre las líneas 9 y 150, estaba sin cubrir. Los componentes **sí** estaban incluidos en el LCOV analizado; no era un fallo de descubrimiento de sus tests ni de importación general del reporte.

El runner se había ejecutado de forma independiente, pero `npm run test:coverage:qa` no lo invocaba. Por eso su ejecución real no llegaba a la fusión V8 ni al LCOV de CI. Se agrega esa invocación con el mismo `NODE_V8_COVERAGE` que el resto del QA y una comprobación que impide generar el reporte final si faltan líneas y ramas ejecutadas de este runner. Se conservan el inventario de fuentes, los denominadores y la configuración de Sonar/Vitest; no se agregan exclusiones ni se baja el umbral.

Se incorporan 15 pruebas de Testing Library: respuesta visible/oculta para cada una de las diez preguntas, navegación desde ambos paneles y regreso manteniendo la sesión, otras teclas y reapertura del tooltip, pérdida de foco hacia fuera de la página y asociación independiente de descripciones entre dos tooltips. El archivo de ayuda pasa de 14 a 29 pruebas. Enter/Espacio sobre los desplegables nativos se verifican en Chrome; no se simula artificialmente su comportamiento nativo en jsdom.

La cobertura unitaria por sí sola conserva el runner en 0 %; el reporte que debe consumir Sonar es el **LCOV final fusionado**, después de `npm run test:coverage:qa`. CI ya ejecuta ambos comandos antes del análisis y declara `sonar.javascript.lcov.reportPaths=coverage/lcov.info`. Su paso de integridad verifica rutas relativas, inventario completo, ausencia de duplicados y concordancia entre DA/LF/LH y el resumen.

Referencias de diagnóstico, solo lectura: [Quality Gate del PR](https://sonarcloud.io/dashboard?id=orianalinaferrari_servimap-frontend&pullRequest=34), [métricas por archivo](https://sonarcloud.io/component_measures?id=orianalinaferrari_servimap-frontend&pullRequest=34&metric=new_coverage&view=list). La métrica remota de código nuevo requiere publicar los cambios y volver a analizar el PR; no se debe presentar la cobertura local como un Quality Gate remoto aprobado.

### Resultado local de la corrección

Con Node `v26.13.0`, `npm run test:coverage` ejecutó los 699 tests de los 74 archivos. `npm run test:coverage:qa` completó los recorridos existentes y las 40 comprobaciones de ayuda, fusionando siete reportes V8. El control de LCOV extraído del workflow también pasó: 94 fuentes, sin duplicados, con el inventario y los contadores íntegros.

| Archivo nuevo | Líneas locales | Ramas locales |
| --- | --- | --- |
| `PreguntasFrecuentes.jsx` | 100 % (5/5) | Sin ramas instrumentadas |
| `AyudaBreve.jsx` | 100 % (9/9) | 90 % (9/10) |
| `faqs-ayuda.mjs` | 93,63 % (103/110) | 78,04 % (32/41) |

Para estos tres archivos, el agregado local es 94,35 % de líneas (117/124), 80,39 % de ramas (41/51) y 90,29 % al combinar ambos contadores (158/175). Esto **no** es el porcentaje remoto de código nuevo: Sonar establece sus propias líneas ejecutables, condiciones y alcance del diff. El reporte completo del proyecto tiene 95,42 % de líneas y 88,83 % de ramas; tampoco equivale a la métrica nueva del PR.

Quedan sin ejecutar las líneas 23, 41, 76, 143–145 y 149 del runner, asociadas al rechazo/timeout de CDP, bloqueo de tráfico indebido y manejo/limpieza de fallos. Sus ramas pendientes están en las líneas 69, 74, 77–79, 145 y 148. En `AyudaBreve.jsx` queda la rama defensiva de blur hacia un descendiente (línea 15); sus tooltips actuales contienen texto sin controles internos. No se añaden interacciones irreales ni se provocan fallos de infraestructura solo para colorear esas ramas.

Lint, build y `git diff --check` aprobados. Se conserva el aviso de chunks grandes. No se modifican archivos funcionales ni las respuestas de las FAQs. Los cambios quedan pendientes de commit, push y nueva ejecución de SonarCloud en el PR #34.
