# Identificadores visibles: auditoría y contrato pendiente

## Estado comprobado (03/11/2026)

La parte de presentación puede corregirse con los datos existentes. El nuevo
identificador de solicitud generado mediante `identity`, único y distinto de
la clave primaria, requiere una modificación del backend y de su base de datos.
No se generaron números en el navegador ni se cambiaron rutas o relaciones.

### Identificadores reales

| Entidad/campo | Función actual |
| --- | --- |
| `Solicitud.id` | Cadena UUID autogenerada, clave primaria (`@id @default(uuid())`). También se expone como `id` en la API. |
| `Usuario.id` | Cadena UUID autogenerada, clave primaria de usuarios de cualquier rol. Para CLIENTE es el identificador referenciado por las solicitudes. |
| `Solicitud.clienteId` y `cliente.id` del listado | Referencian `Usuario.id`; no un número de cliente independiente. |
| `Prestador.id` | UUID de la entidad profesional, distinto del ID de su usuario. |
| `Prestador.usuarioId` | Relación única con `Usuario.id`. |
| `Solicitud.prestadorId` y `prestador.id` del listado | Referencian `Prestador.id`, no `Usuario.id`. |
| `Solicitud.oficioId` | Referencia `Oficio.id`, también UUID. |
| `Usuario.dni` y `Usuario.email` | Campos únicos de la cuenta; no son la clave primaria ni un nuevo identificador público de cliente. |

No hay modelo `Cliente` separado ni campo de identificador público secuencial
de cliente o solicitud en el esquema revisado. Un UUID ya es autogenerado y
único, pero **no cumple** el pedido de agregar otro campo con `identity` sin
convertirlo en clave primaria. Los UUID expuestos por la API siguen siendo
claves de las operaciones; no deben sustituirse por futuros números visibles.
Las migraciones publicadas también confirman claves primarias de texto y la
relación `Solicitud.clienteId` con `Usuario.id`; no contienen columnas identity.

### Contratos reales y fuentes

- Swagger desplegado, consultado en modo lectura y con respuesta HTTP 200:
  https://servimap-backend.vercel.app/api-docs/
  (definición en `/api-docs/swagger-ui-init.js`).
- `POST /api/solicitudes` devuelve `id`, `clienteId`, `prestadorId`, `oficioId`
  y los datos de solicitud. El cliente propietario se obtiene del JWT; el
  frontend envía el ID del perfil profesional y el ID del oficio.
- `GET /api/solicitudes` devuelve las propias según el rol, incluyendo esos
  IDs y los resúmenes `cliente`, `prestador` y `oficio`. No devuelve otro
  identificador único generado por identity.
- Las transiciones PATCH usan el `id` actual en la ruta; las calificaciones
  relacionan `solicitudId` con ese mismo UUID. No existe GET de detalle de
  solicitud: el detalle del frontend usa el elemento del listado.
- `GET /api/auth/me` devuelve el `id` de usuario y sus datos de cuenta; el DNI
  se expone allí a su dueño. No hay un código público de cliente independiente.
- Fuentes backend verificadas en revisión
  `a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c`:
  [Prisma](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/prisma/schema.prisma),
  [servicio de solicitudes](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/src/services/solicitudesService.js)
  y [Swagger fuente](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/src/config/swagger.js).

Se revisaron README (flujos y advertencia de no intercambiar IDs), documentos
de integración y casos de prueba del frontend, y la matriz RF-09/RF-10/RF-14/
RF-15 disponible en `tests/qase/requerimientos.js` del backend. No se encontró
una definición adicional del cambio solicitado para identificadores de clientes.
El pedido de identity proviene de esta corrección indicada por la profesora.

## Presentación auditada y corrección implementada

- Listados de cliente y prestador: antes `Solicitud: #<id>`; ahora
  `ID de solicitud: <id>`, conservando el valor completo devuelto por la API.
- Detalles de ambos roles: antes `Detalle de solicitud #<id>`; ahora
  `Detalle de solicitud · ID: <id>`.
- Actividad reciente del panel del prestador: antes `Solicitud #<id>` o
  `Solicitud #Sin número`; ahora `ID de solicitud: <id>` o
  `ID de solicitud: No disponible` cuando falta el dato.
- No se encontró la etiqueta literal «Número de solicitud» en producción;
  sí la presentación con `#` y el respaldo «Sin número», ahora corregidos.
- El perfil del cliente muestra nombre, email, DNI y fecha de registro, no
  un ID de cliente. Las solicitudes del prestador muestran el nombre del
  cliente. Moderación usa `Cliente <clienteId>` como respaldo cuando falta
  nombre; no se cambió ese identificador ni su significado sin una definición.
- La creación de solicitudes no genera IDs locales. Selecciones, claves de
  React, acciones, payloads y relaciones siguen usando los mismos IDs de API.

## Contrato necesario para backend

1. Agregar a Solicitud un **campo adicional** único y generado por la base
   mediante identity, manteniendo `Solicitud.id` UUID como clave primaria y
   conservando sus relaciones y contratos operativos.
2. Acordar nombre exacto, tipo, rango y representación JSON del campo nuevo,
   y cualquier prefijo/formato de presentación. Si excede el rango entero
   seguro de JavaScript, devolver una representación sin pérdida de precisión.
   No hay nombre de propiedad nuevo confirmado para implementar en frontend.
3. Definir migración de solicitudes existentes, asignación de valores únicos,
   concurrencia e inmutabilidad. La generación corresponde a la base/backend,
   nunca al cliente; no prometer una secuencia sin huecos.
4. Incluir el campo en las respuestas de creación, listado y transiciones,
   documentando su contrato en Swagger. El detalle usa el listado; las rutas
   y las claves foráneas deben continuar identificando por el UUID actual.
5. Probar unicidad, generación automática, conservación de PK/relaciones y
   acceso según titularidad y rol. No se modificó el backend en esta rama.

### Decisión pendiente para clientes

Debe precisarse si «revisar los identificadores de clientes» significa:

- Cambiar únicamente una etiqueta o mostrar el UUID actual, indicando en qué
  pantallas y para qué roles; o
- Agregar un identificador público independiente del UUID. En ese caso definir
  si pertenece al usuario o solo a CLIENTE, cómo se genera, unicidad, formato,
  tratamiento de registros existentes y en qué respuestas/roles se expone.

No se puede deducir que también se solicite identity para clientes, ni que deba
reemplazarse su UUID por DNI o por el ID de un prestador. Hasta definirlo, no se
agregan identificadores al perfil ni se altera la exposición de datos de clientes.

## Pruebas

Las pruebas de integración con HTTP simulado verifican UUID completo en ambos
listados/detalles, apertura y cierre, y los mismos UUID en aceptar, rechazar,
finalizar y cancelar. Se comprueba que las relaciones cliente/prestador/oficio
se conservan. El panel cubre ID existente y dato ausente, sin números inventados.
El futuro campo identity no se simula como si estuviera disponible en producción.

Validación local con Node `26.13.0` (no se encontró Node 24 disponible):

- 54 pruebas dirigidas y suite completa de 754 pruebas en 76 archivos aprobadas.
- Lint, build y `git diff --check` correctos; permanece el aviso conocido de
  tamaño de chunks de MapLibre.
- QA de navegador con API simulada: 106 comprobaciones principales, 40 de
  ayuda, 49 de cliente, 62 de prestador y 65 de lecturas aprobadas; build
  estático verificado en 16 rutas SPA. Sin escrituras sobre datos productivos.
- LCOV combinado generado con los comandos del proyecto: 96 fuentes,
  95,76 % de líneas y 89,52 % de ramas globales. Los tres componentes modificados
  están incluidos en LCOV y sus etiquetas se verifican en pruebas. El reporte
  atribuye el JSX a sentencias contenedoras, no a cada línea textual de etiqueta;
  no se deduce de ello un porcentaje remoto de código nuevo. No se cambiaron
  umbrales ni exclusiones ni se solicitó un análisis remoto de SonarCloud.
