# Consultas al administrador: preparación y contrato propuesto

Auditoría: 03/11/2026. **No es una funcionalidad operativa ni un contrato existente.**

## Estado verificado

Base frontend: `origin/main` con el PR #41 fusionado, merge
`306bb4f4aeaf5c21d3136594a6bd28c72e8b3016`.
El [Swagger público](https://servimap-backend.vercel.app/api-docs/), incluida
su definición `/api-docs/swagger-ui-init.js`, respondió 200 y contiene 24 rutas,
ninguna de soporte, consultas, ayuda o tickets. Se contrastaron el montaje de
[routers](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/src/app.js)
y el [esquema de datos](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/prisma/schema.prisma)
del backend: no hay entidades ni endpoints de consultas.

Se conservan las diez FAQs, los tooltips, las rutas y la autenticación actuales.
Debajo de las FAQs se informa que las consultas directas todavía no están
disponibles. El panel administrativo incorpora la sección Consultas con el mismo
aviso. No hay controles de envío, respuesta o cierre operativos en producción.

Los componentes independientes están preparados para un adaptador inyectado.
Únicamente tests y QA proporcionan datos/adaptadores ficticios. No se agregaron
rutas HTTP de soporte, almacenamiento local, correos, servicios externos ni
actualizaciones del backend. La disponibilidad predeterminada es `false`.

## Alcance y decisiones propuestas

Una consulta tiene un mensaje inicial y, como propuesta inicial, **una respuesta
administrativa**. No se implementa conversación ilimitada, edición de respuestas,
reapertura ni eliminación. Estos alcances deben confirmarse antes de activar.
No hay compromiso de tiempo de respuesta, notificaciones ni SLA.

Categorías propuestas: `SOLICITUDES`, `PAGOS`, `CUENTA`, `OTRAS`.
Consultar sobre pagos no implica procesar cobros o reembolsos. Soporte no altera
solicitudes, no revierte finalizaciones y no constituye mediación de disputas.

## Modelo propuesto, pendiente de migración backend

Consulta: UUID interno, `autorId` vinculado a Usuario, categoría, asunto, mensaje,
estado, `fechaCreacion`, `fechaActualizacion`, `fechaCierre` nullable y
`cerradaPorId` nullable. Respuesta: UUID, `consultaId` único, administrador autor,
mensaje y fecha de creación. Ningún ID/propietario/fecha lo decide el navegador.

`solicitudId` es una relación opcional a evaluar. **No se envía ni se ofrece en
esta preparación**. Si se incorpora, validar en servidor que la solicitud
pertenezca al cliente o al perfil profesional del prestador autenticado. Usar el
ID interno real de solicitud; vincular una consulta nunca cambia sus estados.

Estados y transiciones propuestas:

| Operación | Origen | Destino | Responsable |
| --- | --- | --- | --- |
| Crear | No existe | PENDIENTE | CLIENTE o PRESTADOR activo |
| Responder una vez | PENDIENTE | RESPONDIDA | ADMINISTRADOR activo |
| Cerrar sin respuesta | PENDIENTE | CERRADA | ADMINISTRADOR activo |
| Cerrar después de responder | RESPONDIDA | CERRADA | ADMINISTRADOR activo |

CERRADA no admite respuestas ni transiciones adicionales. Cerrar conserva
mensajes/respuesta e historial. La actualización debe ser atómica: dos
administradores no pueden responder simultáneamente la misma consulta. Un
conflicto devuelve 409, preservando el estado persistido. Acordar idempotencia
para reintentar creación/respuesta/cierre ante una respuesta de red perdida;
no asumir que una operación fallida en el navegador no llegó al servidor.

## Endpoints NUEVOS propuestos: ninguno existe hoy

Todas las operaciones usan Bearer y verificación de cuenta activa en servidor.

| Método y ruta propuestos | Permiso | Request / resultado |
| --- | --- | --- |
| POST `/api/consultas` | CLIENTE/PRESTADOR | Categoría, asunto y mensaje; 201 con consulta confirmada |
| GET `/api/consultas/mias` | CLIENTE/PRESTADOR | Historial propio paginado, autor derivado del JWT |
| GET `/api/consultas/{id}` | Autor o ADMINISTRADOR | Detalle y respuesta permitidos; no lista administrativa |
| GET `/api/admin/consultas` | ADMINISTRADOR | Bandeja global paginada, filtro por estado |
| PATCH `/api/admin/consultas/{id}/respuesta` | ADMINISTRADOR | Mensaje de respuesta; 200 con estado RESPONDIDA confirmado |
| PATCH `/api/admin/consultas/{id}/cerrar` | ADMINISTRADOR | Body vacío; 200 con estado CERRADA confirmado |

Las rutas deben acordarse y publicarse en Swagger antes de crear servicios HTTP.
El administrador no se registra desde el formulario público actual. Una persona
sin sesión no puede enviar ni leer mensajes; un cliente/prestador nunca consulta
ni responde mensajes ajenos. No aceptar `autorId`, rol, estado o timestamps en
el body. La autorización frontend es solo UX: **servidor debe imponer permisos**.

## Request y DTO propuestos

Ejemplos ficticios, IDs ilustrativos y datos sin personas reales.

Crear:

```json
{
  "categoria": "CUENTA",
  "asunto": "Consulta de ejemplo",
  "mensaje": "Necesito orientación sobre el uso de mi cuenta."
}
```

Responder:

```json
{"mensaje": "Orientación de ejemplo confirmada por administración."}
```

DTO común de detalle y de las respuestas confirmadas de escritura:

```json
{
  "id": "11111111-1111-4111-8111-111111111111",
  "autorId": "22222222-2222-4222-8222-222222222222",
  "categoria": "CUENTA",
  "asunto": "Consulta de ejemplo",
  "mensaje": "Necesito orientación sobre el uso de mi cuenta.",
  "estado": "RESPONDIDA",
  "fechaCreacion": "2026-11-03T15:00:00.000Z",
  "fechaActualizacion": "2026-11-03T16:00:00.000Z",
  "fechaCierre": null,
  "respuesta": {
    "mensaje": "Orientación de ejemplo confirmada por administración.",
    "fechaCreacion": "2026-11-03T16:00:00.000Z"
  }
}
```

PENDIENTE devuelve `respuesta: null`. RESPONDIDA exige respuesta válida.
CERRADA conserva la respuesta existente o null si se cerró sin responder.
Crear, responder y cerrar deben devolver valores persistidos, no solo `{ok:true}`.
No exponer hashes, JWT, DNI, email privado ni datos de otros usuarios en estos DTO.

Todos los timestamps del servidor son ISO 8601 UTC con `Z`. El frontend conserva
la cadena original en `time.dateTime` y presenta el día en Buenos Aires con la
utilidad existente. No usa la fecha actual como reemplazo de persistencia.

## Paginación y filtros propuestos

GET propios y administrativo aceptan `pagina` entero desde 1, `limite` de 20
para el cliente preparado y `estado` opcional del enum. Propuesta de máximo
servidor: 50; el frontend preparado solicita 20. La respuesta usa el mismo
conjunto autorizado y filtrado para registros, total y páginas. Orden estable:
`fechaCreacion DESC, id DESC`. No calcular totales sobre una lista truncada.

```json
{"datos": [], "pagina": 1, "total": 0, "totalPaginas": 1}
```

`datos` contiene DTO como el anterior. `totalPaginas = max(1, ceil(total/limite))`;
una página fuera de rango debe producir un error acordado, sin inventar registros.
El frontend reinicia a 1 al cambiar estado y descarta lecturas desactualizadas.
Confirmar el diseño para inserciones/eliminaciones concurrentes y filtros que
dejan la página vacía. Se puede adoptar cursor si el equipo lo prefiere, pero
eso exige adaptar explícitamente el puerto y los controles preparados.

## Validaciones y seguridad a cargo del servidor

- Propuesta: asunto de 1 a 100 y mensaje/respuesta de 1 a 2000 caracteres tras
  trim. Los límites del prototipo cuentan unidades UTF-16 (`String.length`);
  acordar el mismo conteo o adaptar frontend/backend juntos para Unicode.
- Categoría/estado por lista permitida; campos desconocidos o protegidos deben
  rechazarse. Validar UUID de rutas y asociación opcional; impedir asignación masiva.
- Contenido como texto plano, sin HTML interpretado ni adjuntos en esta etapa.
  Parametrizar acceso a DB; React escapa textos al mostrarlos. Limitar tamaño de
  body, frecuencia y consultas por usuario para evitar abuso; acordar cuotas.
- Propiedad desde JWT; responder 404 ante recursos ajenos sin revelar su existencia.
  No filtrar únicamente en frontend ni devolver el historial de otro usuario.
- Mantener auditoría de autor, administrador, cambios y fechas sin registrar
  mensajes completos, credenciales o datos sensibles en logs/analítica.
- Consultas son información privada: respuestas `Cache-Control: no-store`, CORS
  para orígenes autorizados y ninguna inclusión en JWT/localStorage.
- Definir retención, acceso administrativo, respaldo y procedimiento para datos
  personales escritos accidentalmente. No enviar mensajes por correo ni terceros
  sin otro requisito y autorización.

## Errores propuestos

Conservar `{ "error": "mensaje comprensible" }` del cliente HTTP existente,
sin stack, SQL, tokens ni texto privado de consultas ajenas.

| HTTP | Caso |
| --- | --- |
| 400 | Contenido, estado de filtro o página inválidos |
| 401 | Sesión ausente, inválida o vencida |
| 403 | Rol/cuenta sin permiso |
| 404 | Consulta inexistente o ajena |
| 409 | Estado/revisión cambiados o duplicación concurrente |
| 429 | Cuota/frecuencia superada |
| 500 / 503 | Error temporal sin detalles internos |

Los componentes preservan borradores y no anuncian éxito tras errores ni después
de un 200 sin el DTO esperado. Los mensajes de soporte usan errores públicos
predefinidos; no imprimen arbitrariamente el texto interno del adaptador.

## Componentes y activación futura

- `CentroConsultas`: compuerta de disponibilidad y sesión/rol. La versión activa
  remonta su bandeja al cambiar identidad/rol para no mezclar historiales.
- `BandejaConsultas`: coordinación, consultas paginadas, verificación de titularidad,
  lecturas tardías y cambios confirmados. No crea endpoints ni guarda mensajes.
- `FormularioConsulta`: categoría, asunto y mensaje; validación y borrador.
- `ListaConsultas`: listado, estados, fechas, detalle y paginación según servidor.
- `DetalleConsulta` y `RespuestaConsulta`: lectura, respuesta y confirmación de
  cierre; acciones solo para administradores en los estados propuestos.
- `consultasService`: solo declara disponibilidad desactivada y verifica el puerto;
  **no es un cliente HTTP de soporte implementado**.

Puerto preparado: `disponible`, `crear(datos)`, `listar({pagina,limite,estado})`,
`obtener(id)`, `responder(id,mensaje)`, `cerrar(id)`. Los métodos son asíncronos y
devuelven el DTO propuesto. No reciben un usuario destino desde el formulario.
El adaptador futuro debe usar `apiRequest` para JWT/401/HTTPS y elegir el listado
propio o administrativo según el flujo autorizado, con respaldo obligatorio en
servidor. La bandera del adaptador nunca sustituye autenticación.

Orden de activación:

1. Acordar modelo, rutas, validaciones, estados, idempotencia, cuotas y retención.
2. Implementar backend y tests de autorización/persistencia; publicar Swagger.
3. Conectar y probar el adaptador HTTP en staging, incluyendo pérdida de respuesta,
   idempotencia y conflictos. Adaptar el puerto si el contrato definitivo difiere.
4. Cablear explícitamente el adaptador desde Ayuda/panel, hoy sin servicio.
   No habilitar por una variable pública que simule capacidad del servidor.
5. Verificar que el cierre/respuesta guarde realmente y que los GET posteriores,
   recarga y nuevo login restauren contenido/estado confirmados. No prometer
   actualización instantánea entre sesiones; no hay eventos/notificaciones.
6. Ejecutar regresiones completas, QA responsive/teclado y LCOV antes de publicar.

## Criterios de aceptación

- Las diez FAQs y sus tooltips funcionan con o sin sesión y sin soporte backend.
- Mientras no exista adaptador real, ninguna pantalla ofrece enviar/responder/cerrar
  ni intenta endpoints nuevos. La sección informativa permite conocer la limitación.
- Cliente y prestador crean solo como ellos mismos; visitantes y administradores
  no usan la creación de usuarios. Historial/detalle ajeno rechazados en servidor.
- Administrador filtra/abre/responde/cierra; otros roles no acceden a la bandeja.
- Campos vacíos, espacios, exceso de longitud y enums falsos se rechazan. Texto
  con HTML se muestra literalmente, sin ejecución ni inserción de etiquetas.
- Cargas tardías o cambio de cuenta no revelan datos anteriores. Errores
  401/403/404/409/500 no borran borradores ni confirman operaciones inexistentes.
- Página/filtros conservan totales autorizados; estados/transiciones consistentes
  y consultas cerradas sin acciones de respuesta o cierre adicional.
- En staging autorizado: enviar, reconsultar, responder/cerrar, recargar y volver
  a iniciar sesión; datos y timestamps persisten, sin escrituras locales ficticias.
- Teclado, foco, lectores de pantalla, touch y anchos 320/390/768/1365 utilizables.
- Ningún envío cambia solicitudes, procesa pagos, reembolsa o promete mediación/SLA.

## Decisiones pendientes del equipo backend/producto

Confirmar una respuesta o conversación, quién puede cerrar, eventual reapertura,
relación opcional con solicitud, conteo Unicode, límites/cuotas, paginación,
idempotencia/concurrencia y política de retención. Las rutas y límites anteriores
son propuestas para acordar; no se afirma que estén desplegados.
