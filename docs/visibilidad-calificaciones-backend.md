# Calificaciones ocultas: auditoría y corrección pendiente

## Resultado (03/11/2026)

El requerimiento **no está resuelto en los agregados del backend**: las
calificaciones moderadas se excluyen del listado público de comentarios, pero
siguen incluidas en el promedio y en `totalCalificaciones`. El frontend consume
estos agregados y no debe reemplazarlos por cálculos de una lista de comentarios.
No se modificó la interfaz productiva ni la moderación del administrador.

## Contrato real verificado

Swagger público consultado con HTTP 200:
https://servimap-backend.vercel.app/api-docs/
(definición en `/api-docs/swagger-ui-init.js`). Código backend revisado en
`a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c`, sin modificarlo.

| Operación/dato | Comportamiento comprobado |
| --- | --- |
| `GET /api/calificaciones/prestador/{prestadorId}/reputacion` | Público; devuelve `prestadorId`, `promedio` (número o null), `totalCalificaciones` y `serviciosFinalizados`. |
| `GET /api/prestadores` y `GET /api/prestadores/{id}` | Incluyen `reputacion.promedio`, `totalCalificaciones` y `serviciosFinalizados`, reutilizando `obtenerReputacion`. |
| `GET /api/calificaciones/prestador/{prestadorId}` | Público; devuelve únicamente `moderada: false`, con `id`, `puntaje`, `comentario` y `fechaPublicacion`. No devuelve el flag ni identidad del cliente. |
| `comentarios` de la ficha y `GET /api/prestadores/me/calificaciones` | Reutilizan ese listado sin moderadas; el segundo requiere JWT y rol PRESTADOR. |
| `GET /api/calificaciones` | Solo ADMINISTRADOR; incluye registros moderados y no moderados, con `moderada`, `fechaModeracion` y `motivoModeracion`. |
| `PATCH /api/calificaciones/{id}/moderacion` | Solo ADMINISTRADOR; requiere `motivo` no vacío de hasta 200 caracteres. Guarda `moderada: true`, fecha y motivo. No elimina la calificación. |
| `GET /api/prestadores/mapa` | Devuelve `promedio` obtenido mediante otro agregado sin filtro de moderación. No devuelve cantidad. |

`obtenerReputacion` ejecuta `prisma.calificacion.aggregate` con
`where: { prestadorId }`, `_avg: { puntaje: true }` y `_count: { puntaje: true }`.
Le falta el filtro `moderada: false`. Redondea a una cifra decimal; si no hay
calificaciones, el promedio es null y la cantidad cero.

`mapaService.listarMarcadores` usa `prisma.calificacion.groupBy` por prestador,
también sin `moderada: false`. Cambiar solo el primer agregado dejaría respuestas
de API inconsistentes.

Fuentes:

- [Servicio de calificaciones](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/src/services/calificacionesService.js):
  `obtenerReputacion`, `listarCalificacionesPrestador`, `moderarCalificacion`.
- [Servicio del mapa](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/src/services/mapaService.js):
  `listarMarcadores`.
- [Servicio de prestadores](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/src/services/prestadoresService.js):
  listado, detalle y calificaciones del perfil propio.
- [Router de calificaciones](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/src/routes/calificacionesRouter.js)
  y [Swagger](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/src/config/swagger.js).

## Qué muestra y calcula el frontend

- `prestadoresService.adaptarPrestador` copia `reputacion.promedio` a
  `calificacionPromedio` y conserva `reputacion.totalCalificaciones`. No suma
  puntajes ni calcula promedios a partir de comentarios.
- `BuscadorPrestadores` muestra ese promedio con una estrella y la cantidad
  entre paréntesis si está disponible. El filtro de calificación mínima usa el
  promedio de API, tanto en consulta remota como en su comprobación local.
- `ReputacionPrestador` en la ficha muestra estrellas y el promedio recibido.
  No muestra un contador total de calificaciones. Sus comentarios se filtran
  por prestador y `!moderada`; las respuestas públicas no traen el flag porque
  backend ya selecciona solo las visibles. No se cambia esa compatibilidad.
- El perfil propio del prestador muestra puntajes y comentarios de
  `/api/prestadores/me/calificaciones`, que ya excluye moderadas. No calcula
  promedio ni total. Los paneles de cliente/prestador no muestran agregados de
  reputación; sus contadores son de solicitudes.
- Los popups actuales del mapa no muestran el `promedio` de sus marcadores;
  abren la ficha que utiliza `reputacion`. Aun así, el agregado del endpoint del
  mapa debe corregirse para mantener el contrato consistente.
- Moderación separa listas y cantidades por `moderada`. El administrador tiene
  permiso para consultar las ocultas y su motivo; ese funcionamiento no cambia.
- La calificación propia mostrada tras calificar una solicitud no es un agregado
  público. No se convierte una calificación ocultada en permiso para volver a
  calificar: la relación y la regla de una calificación por solicitud se conservan.
- Los mocks de `src/data` no se usan como reemplazo de la API productiva ni se
  modificaron para aparentar la corrección del agregado.

## Corrección solicitada al equipo backend

1. Agregar `moderada: false` al conjunto de calificaciones usado por `_avg` y
   `_count` en `obtenerReputacion`, manteniendo nombres, tipos y redondeo.
2. Agregar el mismo filtro al `groupBy` de `mapaService.listarMarcadores`.
3. Verificar que listado, ficha, endpoint de reputación y filtro
   `calificacionMin` utilicen los agregados corregidos. La cantidad significa
   calificaciones visibles, incluso si su comentario es nulo o vacío.
4. Cuando solo haya ocultas, devolver `promedio: null` y
   `totalCalificaciones: 0`. No confundir ese total con `serviciosFinalizados`:
   ocultar una reseña no deshace el trabajo ni modifica ese contador.
5. Tras una moderación confirmada, una nueva consulta debe reflejar los valores
   corregidos. No se promete actualización instantánea entre pestañas; no hay
   canal de eventos de moderación contratado en el frontend.
6. Preservar permisos, registro de motivo/fecha, respuestas públicas sin contenido
   oculto y regla de una calificación por solicitud. No se requiere un endpoint
   nuevo ni acceso del público al listado administrativo para recalcular.

Casos de aceptación backend (puntajes de prueba, no datos productivos):

| Caso | Promedio esperado | Total visible |
| --- | --- | --- |
| Ninguna calificación | null | 0 |
| Visibles 5 y 3 | 4.0 | 2 |
| Visibles 5 y 3, oculta 1 | 4.0 | 2 |
| Ocultar la visible de 3 del caso anterior | 5.0 | 1 |
| Solo ocultas | null | 0 |

Probar también aislamiento entre prestadores, comentarios nulos, búsquedas con
calificación mínima y coherencia con el endpoint de mapa.

## Alcance y pruebas de esta rama

Solo se agregan pruebas y documentación. No se inventa un agregado alternativo
en frontend ni se asume que backend ya está corregido. No se hicieron escrituras
reales para moderar ni se utilizaron credenciales locales.

Las pruebas nuevas verifican la no exposición de comentario/autor/motivo de
registros marcados como moderados, aislamiento por prestador y actualización de
la lista al recibir una moderación. Verifican también que el promedio de API no
se reconstruya a partir de un comentario aislado, y que tarjeta/ficha conserven
los agregados recibidos en casos sin calificaciones y con valores distintos.
Los valores HTTP son fixtures del contrato de consumo, **no evidencia de que la
API real excluya ocultas de los agregados**. Los tests existentes cubren el flujo
administrativo; el cumplimiento definitivo requiere la corrección backend.

## Validación local

- Node `26.13.0`; no se encontró Node 24 instalado ni en la caché npm consultada.
- 28 pruebas dirigidas y suite completa de 759 pruebas en 76 archivos aprobadas.
- Lint, build y `git diff --check` correctos. Persiste el aviso conocido de
  tamaño de chunks de MapLibre.
- LCOV generado con `npm run test:coverage` y validado con el verificador del
  workflow: 96 fuentes, inventario y conteos consistentes. Cobertura unitaria
  global de 68,61 % de líneas y 80,38 % de ramas; incluye scripts QA de navegador
  no ejecutados en esta auditoría. No equivale a la cobertura combinada de CI
  ni a la de código nuevo de SonarCloud. No se modificaron umbrales ni exclusiones.
- No se repitió QA de navegador porque no hubo cambios funcionales ni visuales.
- PR #37 confirmado fusionado; rama creada desde `origin/main` en `0676ed9`.
  El PR #29 se consultó en modo lectura y continúa abierto como Draft.
