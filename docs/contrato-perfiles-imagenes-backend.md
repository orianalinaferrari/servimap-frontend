# Contrato propuesto: datos de cuenta y fotografías de perfil

Fecha de auditoría: 03/11/2026. **Especificación para acordar, no implementación.**
Solo se crea este documento. No se modifican backend, frontend productivo, tests,
CI o almacenamiento; no se crean cuentas ni se instalan SDK o proveedores.

## 1. Estado actual verificado

Frontend: `origin/main` en `b9cf1ac7f29c2b08ef319b136dde3c75b8d558c2`, después
del [merge del PR #39](https://github.com/orianalinaferrari/servimap-frontend/pull/39).
Backend auditado en `a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c`, en modo lectura.
Swagger desplegado consultado con HTTP 200:
https://servimap-backend.vercel.app/api-docs/
(definición en `/api-docs/swagger-ui-init.js`).

### Contratos existentes, no propuestas

| Operación real | Permisos | Comportamiento relevante |
| --- | --- | --- |
| `POST /api/auth/register` | Público, CLIENTE/PRESTADOR | Crea usuario con `nombre`, `dni`, `email`, `password`, `rol`. No edita una cuenta. |
| `POST /api/auth/login` | Público | Devuelve JWT y `usuario` con id, nombre, email y rol. |
| `GET /api/auth/me` | JWT del dueño | Devuelve id, nombre, DNI, email, rol y fechaRegistro. No devuelve foto del usuario. |
| `GET /api/prestadores/me` | JWT + PRESTADOR | Perfil profesional propio; incluye nombre/email relacionados y `fotoPerfil`. Su id es el del prestador. |
| `PUT /api/prestadores/me` | JWT + PRESTADOR | Edita únicamente campos profesionales admitidos. Guarda una cadena `fotoPerfil`; no recibe archivos. |
| `GET /api/prestadores` y `GET /api/prestadores/{id}` | Público | Devuelven resumen/ficha profesional con foto por URL. |

El PUT profesional admite `descripcionProfesional`, `fotoPerfil`, `zonaCobertura`,
`telefono`, `whatsapp`, `emailContacto`, `precioMin`, `precioMax`, `latitud`,
`longitud` y `disponible`. Los oficios usan su contrato separado. No admite nombre,
DNI, email de cuenta ni rol. `emailContacto` no cambia el email de login.

El controlador actual admite `fotoPerfil: ''` para quitar la referencia y recorta
la cadena. No verifica realmente el contenido de una imagen ni implementa subida;
la validación HTTP/HTTPS sin credenciales se hace actualmente en el formulario.
No atribuir al backend una validación de URL o archivos que todavía no realiza.

En Prisma, `Usuario` tiene UUID como PK y nombre/email/DNI/rol; no tiene foto ni
modelo Cliente separado. `Prestador` tiene otro UUID, `usuarioId` único y foto
como cadena opcional. **El propietario de la futura foto debe identificarse por
Usuario.id del JWT, no por el ID del perfil profesional enviado por el cliente.**

No hay ruta de edición de usuario ni de subida, autorización de subida o
eliminación de archivos. El código monta `express.json()`, sin parser multipart.
No se encontraron SDK de almacenamiento en package.json ni módulos de upload
en el árbol backend revisado. Esto no prueba qué cuentas privadas pudiera tener
el equipo: no se inspeccionaron cuentas ni secretos de infraestructura.

Fuentes backend fijadas a la revisión auditada:
[Prisma](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/prisma/schema.prisma),
[authService](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/src/services/authService.js),
[controlador profesional](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/src/controllers/prestadoresController.js),
[servicio profesional](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/src/services/prestadoresService.js),
[app](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/src/app.js)
y [despliegue Vercel](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/vercel.json).

### Componentes y servicios actuales

- `FormularioCuenta`: preparado, sin montar en páginas productivas. Solo edita
  nombre; recibe `onGuardar({nombre})`, comprueba id/nombre de la respuesta plana
  y llama a `onConfirmado(usuario)`. Email/DNI son lectura. No tiene HTTP propio.
- `SelectorFotoPerfil`: preparado, sin montar en páginas productivas. Entrega
  `File` mediante `onSeleccionar` después de cargar la vista previa, o null al
  cancelar/fallar. Acepta JPEG/PNG/WebP/GIF hasta 5.242.880 bytes; `accept=image/*`
  no significa que acepte cualquier formato. Revoca Object URLs. `onEliminar`
  es opcional, espera confirmación y no cambia por sí mismo la URL persistida.
- `PerfilCliente` sigue siendo lectura desde AuthContext. No ofrece guardar ni
  seleccionar archivos. Su avatar y el header del cliente muestran iniciales.
- `PerfilPrestador`, `VistaPerfilPrestador` y `FormularioPerfilPrestador` ya
  conservan las tarjetas durante edición. `actualizarMiPerfil` usa el PUT real
  y emite `EVENTO_PERFIL_PRESTADOR_ACTUALIZADO` para sincronizar la foto.
- `AuthContext` carga cuenta mediante `obtenerSesion` y expone `revalidarSesion`.
  Hoy mezcla en el usuario PRESTADOR la foto del perfil privado. No hace esa
  consulta para CLIENTE. `AvatarSesion` solo renderiza imagen para PRESTADOR.
- `FotoPrestador` acepta URL absoluta HTTP/HTTPS, con iniciales si falla. Una
  URL GET firmada HTTPS puede mostrarse, pero hoy no hay renovación al vencer.
- `apiRequest` envía Bearer a la API, usa `credentials: omit`, permite headers y
  opciones fetch, y espera JSON en respuestas exitosas. No sirve directamente
  para leer bytes de una imagen; **no debe usarse con Bearer para subir a storage**.
  Sus errores usan `{error:string}`; no conserva actualmente los campos de
  validación ni el código de error específico devuelto por backend.

Archivos frontend de referencia:
[contexto](../src/context/AuthContext.jsx),
[sesión](../src/services/authService.js),
[servicio profesional](../src/services/prestadoresService.js),
[cliente](../src/pages/PerfilCliente.jsx),
[prestador](../src/pages/PerfilPrestador.jsx),
[formulario de cuenta](../src/components/perfil/FormularioCuenta.jsx),
[selector de archivo](../src/components/perfil/SelectorFotoPerfil.jsx),
[avatar](../src/components/auth/AvatarSesion.jsx) y
[cliente HTTP](../src/services/apiClient.js).

## 2. Modelo y endpoints propuestos — ninguno existe actualmente

### Separación de responsabilidades

Recomendación: datos personales y referencia de foto comunes en Usuario, con
metadatos de foto gestionada vinculados a su UUID. Los datos profesionales siguen
en Prestador. Cambiar nombre de CLIENTE o PRESTADOR actualiza `Usuario.nombre`;
no crear otro nombre profesional que se desincronice.

Proponer una entidad de foto con id opaco, usuario propietario, clave de storage,
tipo/bytes/dimensiones reales, estado y revisión. La base guarda metadatos, no los
bytes ni una URL firmada que vence. Una intención de subida guarda propietario,
clave asignada, vencimiento, estado e idempotencia. Los nombres de tablas/campos
son propuestas de diseño; el equipo debe decidir la migración, no este frontend.

| Ruta/método propuestos | Resultado |
| --- | --- |
| `PATCH /api/usuarios/me` | Cambiar únicamente `nombre`; devolver usuario actualizado plano. |
| `POST /api/usuarios/me/foto/subidas` | Reservar un objeto privado y obtener autorización temporal de subida. |
| `POST /api/usuarios/me/foto/subidas/{subidaId}/confirmar` | Validar archivo real, normalizar y asociar la nueva foto. |
| `GET /api/usuarios/me/foto/subidas/{subidaId}` | Resolver estado tras error de red o respuesta perdida. |
| `DELETE /api/usuarios/me/foto/subidas/{subidaId}` | Cancelar intención pendiente y programar limpieza. No borrar una foto ya confirmada. |
| `GET /api/usuarios/me/foto` | Obtener metadatos y URL de lectura vigente de la foto propia. |
| `DELETE /api/usuarios/me/foto` | Desvincular foto propia y programar eliminación del objeto gestionado. |

También se propone **ampliar** `GET /api/auth/me` y los DTO de perfil/listado/ficha
profesional con los datos de foto acordados. Conservar todas sus propiedades
actuales y la separación entre usuario y prestador; no reemplazar IDs ni rutas.

## 3. Requests, responses y concurrencia propuestos

Todos los ejemplos son ficticios. Las rutas y propiedades nuevas de esta sección
no están implementadas. Tiempos, revisiones y límites requieren aprobación.

### A. Nombre de la cuenta

Recomendación inicial: solo nombre, cadena no vacía de 1 a 100 caracteres Unicode
después de recortar extremos; conservar mayúsculas, acentos y espacios internos,
sin forzar un patrón de «nombre + apellido». Rechazar controles. **El límite 100
es nuevo**, no una regla actual de edición. Unificarlo con alta y frontend al
implementarlo; no recortar silenciosamente registros históricos más largos.
Para evitar ambigüedad, se propone contar puntos de código y conservar la
secuencia Unicode ingresada; no normalizarla o cambiarla silenciosamente, pues
FormularioCuenta verifica hoy igualdad con el nombre enviado después de trim.

```http
PATCH /api/usuarios/me
Authorization: Bearer <JWT del usuario>
Content-Type: application/json
If-Match: "cuenta-7"

{"nombre":"Ana Gómez"}
```

```http
HTTP/1.1 200 OK
ETag: "cuenta-8"
Cache-Control: no-store
```

```json
{
  "id": "11111111-1111-4111-8111-111111111111",
  "nombre": "Ana Gómez",
  "email": "ana@example.invalid",
  "dni": "12345678",
  "rol": "CLIENTE",
  "fechaRegistro": "2026-03-01T12:00:00.000Z",
  "versionCuenta": 8,
  "fotoId": null,
  "fotoPerfil": null,
  "fotoOrigen": "ninguna",
  "fotoRevision": "foto-0",
  "fotoUrlExpiraEn": null
}
```

La respuesta es plana para `FormularioCuenta`, no `{usuario:...}`. DNI/email se
devuelven al dueño, no pasan a DTO públicos. El JWT actual solo lleva sub/rol;
no necesita incorporar nombre, foto ni bytes. `GET /api/auth/me` debe devolver
la cuenta persistida con la misma estructura ampliada para restaurar sesión.

Rechazar body vacío, campos desconocidos y cambios de `id`, `dni`, `email`,
`rol`, estado, contraseña o campos profesionales. No ignorarlos con un 200 que
aparente guardado. El usuario destino siempre sale del JWT, no del body.

Propuesta de concurrencia: `versionCuenta` y `fotoRevision` independientes;
modificar nombre no debe sobrescribir foto. `If-Match` evita cambios desde una
vista desactualizada. El frontend debe reconstruir el header desde la revisión
del DTO; no depende de que el helper actual lea ETag. CORS debe permitir ese
header; exponer ETag si se decide leerlo. Responder 412 ante revisión distinta
y 428 cuando falte la precondición requerida, preservando los valores vigentes.

### B. Preparar subida directa

```http
POST /api/usuarios/me/foto/subidas
Authorization: Bearer <JWT del usuario>
Content-Type: application/json
Idempotency-Key: 22222222-2222-4222-8222-222222222222

{"nombreArchivo":"foto.jpg","contentType":"image/jpeg","size":1200000}
```

```json
{
  "subidaId": "33333333-3333-4333-8333-333333333333",
  "estado": "pendiente",
  "fotoRevisionBase": "foto-0",
  "upload": {
    "method": "PUT",
    "url": "https://storage.example.invalid/subida?firma=FICTICIA",
    "headers": {"Content-Type":"image/jpeg"},
    "expiresAt": "2026-11-03T17:05:00.000Z",
    "maximumSizeInBytes": 5242880
  }
}
```

Respuesta propuesta: 201. La URL de ejemplo **no es un formato de URL del SDK**;
el adaptador de storage genera la URL real y sus headers. El navegador envía los
bytes directamente allí, usando únicamente método/headers autorizados. No agrega
el Bearer de ServiMap ni usa `apiRequest` apuntando a un dominio ajeno.

Autorización propuesta de 5 minutos, operación PUT sobre una clave exacta nueva,
sin permisos de listar, leer otros objetos, sobrescribir o borrar. Servidor
define clave/propietario; nombre, MIME y tamaño declarados son datos no confiables.
Una URL delegada es una capacidad temporal: mantenerla en memoria, no registrarla,
guardarla en JWT/localStorage ni incluirla en herramientas analíticas.

### C. Confirmar y consultar estado

```http
POST /api/usuarios/me/foto/subidas/33333333-3333-4333-8333-333333333333/confirmar
Authorization: Bearer <JWT del usuario>
Content-Type: application/json
If-Match: "foto-0"
Idempotency-Key: 44444444-4444-4444-8444-444444444444

{}
```

```json
{
  "subidaId": "33333333-3333-4333-8333-333333333333",
  "estado": "completada",
  "foto": {
    "id": "55555555-5555-4555-8555-555555555555",
    "url": "https://storage.example.invalid/lectura?firma=FICTICIA",
    "urlExpiraEn": "2026-11-03T17:15:00.000Z",
    "revision": "foto-1"
  },
  "usuario": {
    "id": "11111111-1111-4111-8111-111111111111",
    "nombre": "Ana Gómez",
    "email": "ana@example.invalid",
    "dni": "12345678",
    "rol": "CLIENTE",
    "fechaRegistro": "2026-03-01T12:00:00.000Z",
    "versionCuenta": 8,
    "fotoId": "55555555-5555-4555-8555-555555555555",
    "fotoPerfil": "https://storage.example.invalid/lectura?firma=FICTICIA",
    "fotoOrigen": "gestionada",
    "fotoRevision": "foto-1",
    "fotoUrlExpiraEn": "2026-11-03T17:15:00.000Z"
  }
}
```

Recomendación: confirmación síncrona y 200 **solo** después de validar, producir
la imagen final y persistir la asociación. El éxito del PUT a storage no basta.
No devolver 202 y lanzar trabajo en memoria después de responder; si se requiere
proceso asíncrono, acordar cola durable, estados y contrato antes de implementarlo.

`GET .../subidas/{subidaId}` informa `pendiente`, `procesando`, `completada`,
`rechazada`, `cancelada` o `expirada`; si está completada permite recuperar la
confirmación tras una respuesta perdida. Consultarlo no publica una foto.
La confirmación es idempotente: repetirla no vuelve a aplicar una foto antigua.
Si después hubo otra actualización, devolver estado de la operación y cuenta/foto
actuales, sin hacer retroceder `fotoRevision` ni resucitar el archivo reemplazado.

### D. Lectura, reemplazo y eliminación

- `GET /api/usuarios/me/foto`: 200 con el mismo DTO `foto` o `foto: null`; URL GET
  vigente, solo del dueño. Los DTO privados usan `Cache-Control: no-store`.
- Una nueva subida confirmada crea otra revisión, con clave de objeto nueva;
  no sobrescribe el mismo pathname cacheado. Hasta confirmar se conserva la foto
  anterior. `If-Match` rechaza confirmaciones desde un estado de foto anterior.
- `DELETE /api/usuarios/me/foto`, con JWT, `If-Match` e Idempotency-Key: 200 con
  `{foto:null,usuario:<DTO actualizado>}` y una nueva fotoRevision. Desvincular
  primero y encolar limpieza durable. Un reintento no debe borrar una foto nueva.
- Cancelar una intención pendiente no elimina la foto actual. Si ya fue
  confirmada, responder conflicto; no interpretar cancelar como borrar perfil.
- Al eliminar una URL externa histórica solo se quita la referencia; no se
  intenta borrar, descargar o modificar un objeto ajeno.

## 4. Permisos y datos por rol

| Actor | Nombre propio | Preparar/confirmar/leer/borrar foto propia | Datos de otro usuario |
| --- | --- | --- | --- |
| Visitante | No | No | Solo resumen/ficha pública del prestador, sin DNI ni datos privados del cliente. |
| CLIENTE activo | Sí, por propuesta | Sí, por propuesta | Ningún permiso de editar o leer foto privada ajena. |
| PRESTADOR activo | Sí, mismo endpoint común | Sí, por propuesta | Conserva exclusivamente su contrato profesional para datos de servicio. |
| ADMINISTRADOR | Fuera de esta corrección | No se habilita implícitamente | No recibe facultad nueva para editar cuentas o acceder a fotos privadas. |
| Proceso de limpieza/validación | No aplica | Solo objetos gestionados mediante credencial de servidor | No ofrece una API pública de borrado por URL arbitraria. |

Validar cuenta activa y rol contra servidor, no solo confiar en datos del body.
Subida ajena: responder 404 sin revelar su existencia. La foto del prestador es
contenido del perfil público; la del cliente es privada por defecto. Para URLs
firmadas, quien posea el enlace puede leerlo durante su vigencia: decidir si esa
capacidad temporal es aceptable o si el cliente requiere proxy autenticado.

## 5. Validación, seguridad y errores propuestos

- Entrada de hasta **5.242.880 bytes (5 MiB)**, no cero. JPEG/PNG/WebP/GIF, como
  el selector preparado. Revalidar bytes reales, firmas y decodificación; no
  confiar en extensión, Content-Type o `size` enviados por el navegador.
- Propuesta: máximo 20 megapíxeles y 8.000 píxeles por lado. Limitar memoria,
  tiempo de decodificación y metadatos. Rechazar SVG, HEIC u otros formatos con
  mensaje explícito; no fingir conversión de fotos del celular no soportadas.
- Orientar según EXIF antes de quitar metadatos/GPS. Producir una variante de
  avatar, por ejemplo hasta 512×512 y 512 KiB, JPEG/WebP, sin scripts ni EXIF.
  Propuesta para GIF: primer fotograma, sin animación; confirmar esta decisión.
  No exigir un recorte cuadrado obligatorio en el UI: puede mantenerse object-fit.
- Subir originales a cuarentena privada. No devolver enlaces de lectura de un
  archivo no validado. Firma/lectura y asociación se permiten solo sobre objetos
  reales de la intención propia, consultados al proveedor desde servidor.
- Claves aleatorias asignadas por servidor; nunca nombre, DNI, email ni rutas
  proporcionadas por cliente. No aceptar URL arbitraria para buscar el archivo
  ni seguir redirecciones externas para validarlo (evitar SSRF).
- Secretos de storage, OIDC de servidor y material de firma quedan en backend.
  Con URLs prefirmadas, generar también la firma en backend; no entregar el
  `clientSigningToken`, BLOB_READ_WRITE_TOKEN u otra clave de alcance amplio.
- Cuotas propuestas: 10 intenciones por usuario cada 15 minutos y 2 pendientes
  simultáneas; ajustar a uso/coste real. Caducar pendientes a 24 h. Proteger el
  endpoint de firma contra abuso; la clave temporal por sí sola no reemplaza la
  comprobación de propiedad al confirmar. No prometer uso único nativo si el
  proveedor no lo garantiza; impedir sobreescritura y doble asociación en backend.
- Mantener claves idempotentes 24 h, con alcance usuario/operación/clave. Misma
  clave y payload devuelve el estado existente, no otro objeto; con otro payload
  responde 409. Una intención expirada exige nueva reserva y una clave nueva.
- Logs sin JWT, URL firmada completa, bytes ni metadatos personales. CORS de API
  restringido al frontend autorizado, con headers de autenticación/idempotencia/
  concurrencia necesarios; storage admite únicamente el flujo aprobado.

| HTTP propuesto | Uso |
| --- | --- |
| 400 | Body inválido, campos protegidos/desconocidos o validaciones de nombre. |
| 401 / 403 | Sesión ausente/vencida / rol o cuenta sin permiso. |
| 404 | Intención o foto ajena/inexistente sin revelar propiedad. |
| 409 / 410 | Estado incompatible o clave idempotente usada con otro payload / intención expirada. |
| 412 / 428 | Revisión desactualizada / falta If-Match requerido. |
| 413 / 415 / 422 | Tamaño / formato no permitido / contenido corrupto o dimensiones inválidas. |
| 429 / 503 | Cuota o frecuencia / almacenamiento o procesamiento temporalmente no disponible. |

Mantener `{ "error": "mensaje comprensible" }` para el helper existente. Se pueden
acordar `codigo` y `campos` adicionales, pero hoy apiRequest solo utiliza el
mensaje y conserva el HTTP status; no afirmar que ya maneja esos detalles.
Los errores conservan la foto/cuenta confirmadas y permiten corregir o reintentar.

## 6. Almacenamiento persistente y compatibilidad

### Alternativas y recomendación, no servicios instalados

Frontend y API ya se despliegan en Vercel. Archivos en `/tmp`, directorio del
proyecto o filesystem de una instancia no son almacenamiento definitivo ni una
URL estable entre despliegues. La base guarda referencias; un object store guarda
las imágenes. No se crea ningún recurso de infraestructura en esta tarea.

| Alternativa | Ventajas | Limitaciones |
| --- | --- | --- |
| Vercel Blob con subida directa y URL firmada | Encaja con el despliegue; permisos temporales y bytes fuera de la función. | Requiere aprobar almacén, SDK compatible, costes/cuotas y política de acceso. |
| Object store compatible con S3 | Permite arquitectura equivalente y mayor independencia del despliegue. | Exige seleccionar/configurar proveedor, firmas, CORS, limpieza y costes. No está autorizado instalarlo. |
| Multipart a la API y luego object store | Un único ingreso autenticado y validación central. | No sirve tal cual para el límite de 5 MiB preparado, por el límite de petición de la función. |

**Recomendación condicionada a aprobación del equipo:** Vercel Blob, subida directa
a un almacén privado, validación en servidor y objetos finales privados con URLs
GET firmadas. Originales nunca públicos. Las respuestas públicas del prestador
pueden entregar URL temporal de la variante ya aprobada; las del cliente solo al
dueño. Alternativa de menor complejidad: variantes públicas de prestadores, si se
aprueba esa exposición. No hacer públicas las fotos de clientes por defecto.

Vercel documenta un máximo de **4,5 MB** en el cuerpo de una función; elevar el
límite de Express no lo elimina. La subida directa evita ese ingreso para el
archivo de 5 MiB. Ver [límites de Functions](https://vercel.com/docs/functions/limitations).

La documentación oficial contempla autorización de subida directa y
[URLs firmadas](https://vercel.com/docs/vercel-blob/vercel-signed-urls), con alcance
por pathname, operación y vencimiento. Generar la URL final en servidor: al
frontend solo llega la capacidad temporal de la operación concreta, no el material
para firmar otras URLs. El formato real y los headers se toman del SDK aprobado,
no del ejemplo de este documento. Validar su disponibilidad y versión antes de
cerrar el contrato; si no están disponibles, acordar el protocolo oficial de
[client uploads](https://vercel.com/docs/vercel-blob/client-upload), no inventarlo.

Para [objetos privados](https://vercel.com/docs/vercel-blob/private-storage), la URL
del objeto sin autorización no es una imagen pública utilizable. Propuesta: GET
firmado por 15 minutos y `fotoUrlExpiraEn` en el DTO. Renovar mediante GET propio
o revalidación antes de vencer, o ante un error de expiración confirmado; no
crear bucles ilimitados de recarga. Como alternativa, un proxy autenticado exige
un servicio de lectura binaria y Object URL controlada en frontend: un `<img>`
no adjunta por sí solo el Bearer de sessionStorage y apiRequest espera JSON.
Los DTO públicos que incluyan firmas tampoco deben cachearse más allá de su
vigencia. Propuesta inicial: no-store también para esos JSON; optimizar TTL solo
con una política explícita que no entregue enlaces vencidos desde caché.

### Compatibilidad con foto por URL del prestador

- Conservar las URLs históricas: `fotoOrigen: externa`, `fotoId: null`,
  `fotoUrlExpiraEn: null`; no copiarlas, descargarlas o borrarlas automáticamente.
  Un valor vacío equivale a ausencia. No migrar datos ni exigir subir un archivo.
- El futuro DTO profesional conserva `fotoPerfil` como cadena mostrable, además
  de `fotoId`, `fotoOrigen`, `fotoRevision` y vencimiento. Sigue usando su ID de
  prestador. Las lecturas de foto gestionada salen de la fuente común del usuario.
- Mantener el PUT histórico para fotos externas mientras sea necesario. Acordar
  validación de nuevas URLs HTTPS y tratamiento de URLs HTTP heredadas; no
  invalidar silenciosamente datos actuales al agregar una política nueva.
- Para foto gestionada, el frontend **omite fotoPerfil del PUT profesional** y
  usa las operaciones de foto. Una URL GET firmada es presentación, no identidad
  ni un valor persistible. El formulario actual incluye ese campo en cada PUT,
  por lo que esta adaptación es obligatoria antes de habilitar archivos.
- Backend debe impedir que un PUT antiguo reemplace una foto gestionada con una
  URL temporal o desactualizada: propuesta, rechazar ese campo con 409 y mensaje
  específico cuando la foto sea gestionada. No ignorarlo con éxito ficticio.
  Los demás campos profesionales pueden guardarse cuando se omite fotoPerfil.
  Desplegar ese soporte frontend antes de activar subidas para usuarios reales.
- El DELETE común también debe poder quitar una referencia externa del propio
  prestador sin borrar el recurso ajeno. No permitir que reaparezca por un
  fallback a la columna antigua después de borrar la foto común: sincronizar o
  anular explícitamente esa referencia en la misma transacción de desvinculación.

### Reemplazos, errores y limpieza

Normalizar/escribir el objeto nuevo antes de cambiar la referencia en una
transacción de base de datos con revisión esperada. La operación de storage y
la transacción SQL no son atómicas: usar compensación/reintentos y registro
durable de tareas pendientes, no borrados en memoria después de responder.

Si falla validar o guardar en DB, conservar la foto anterior y limpiar el objeto
nuevo huérfano. Si se confirma la nueva referencia y falla borrar la anterior,
conservar la nueva y reintentar la limpieza; no volver atrás a una imagen antigua.
El proceso de limpieza comprueba de nuevo que el objeto no esté referenciado.
Nunca borra claves de otro usuario, otro entorno o proveedor externo.

Caducidad y limpieza de canceladas/pendientes requieren tarea programada durable
y métricas de errores; definir responsable y coste. Separar pruebas/preview de
producción. URL nueva por revisión evita caché de un archivo sobrescrito. Acordar
TTL, retención y garantías de revocación: no prometer desaparición inmediata de
copias ya cacheadas o enlaces firmados previamente emitidos.

## 7. Integración frontend futura, sin rediseño

### Servicios que faltan (nombres propuestos)

- `actualizarDatosCuenta({nombre}, versionCuenta)` en servicio de cuenta, usando
  apiRequest y el PATCH acordado. No reutilizar registro ni PUT profesional.
- `prepararSubidaFoto`, `subirArchivoFoto`, `confirmarSubidaFoto`,
  `consultarEstadoSubidaFoto`, `cancelarSubidaFoto`, `obtenerFotoPerfil` y
  `eliminarFotoPerfil`. Las operaciones de negocio usan apiRequest/Bearer;
  `subirArchivoFoto` usa fetch/SDK separado a storage y AbortController, sin JWT.
  Validar HTTPS y host de almacenamiento esperado; usar credentials omit y
  rechazar redirecciones. Un 403 de una firma vencida no debe cerrar la sesión
  de ServiMap; resolverlo como error del flujo de archivo, no del JWT de cuenta.
- Adaptar manejo de errores/headers/versiones y normalizar respuestas reales.
  Si se elige proxy privado, añadir lectura binaria autenticada; no pasarla al
  parser JSON ni permitir Object URLs arbitrarias en FotoPrestador.

### Conectar componentes existentes

1. Habilitar edición en PerfilCliente solo con endpoint desplegado y verificado.
   Reutilizar FormularioCuenta dentro de sus tarjetas y estilo actuales; mantener
   nombre/email/imagen en la identidad y solo campos personales autorizados.
   El componente está preparado para lógica/estilo, no es aún un reemplazo completo
   del layout de PerfilCliente. No agregar secciones de servicio al cliente.
2. `onGuardar` retorna usuario plano confirmado; `onConfirmado` ejecuta y espera
   `revalidarSesion`, verificando mismo usuario/revisión. No invocar un setter
   local para aparentar persistencia. Al editar el nombre del prestador, usar el
   mismo contrato común y recargar perfil profesional, tarjetas y ficha afectadas.
3. Montar SelectorFotoPerfil en el área de foto existente para ambos roles.
   Pasar `nombre`, `fotoActual` vigente y callback de eliminación real solo si
   backend lo soporta. Guardar el File elegido en estado temporal del padre;
   `onSeleccionar(null)` cancela el borrador, no borra la foto persistida.
4. Al guardar: crear intención, subir bytes a URL autorizada, confirmar y
   consultar estado si se perdió respuesta. Mostrar éxito y actualizar URL de
   foto solo con confirmación persistida. Conservar vista previa/datos ante error;
   bloquear dobles envíos y permitir cancelar una subida aún no confirmada.
5. Reemplazar el input de URL por el selector en el flujo nuevo, conservando la
   visualización de las URLs anteriores. Omitir `fotoPerfil` del PUT profesional
   cuando sea gestionada. El padre coordina API y borrador; el selector no realiza
   persistencia. Al cancelar/desmontar, abortar transferencia y liberar Object URL;
   si ya existe intención, cancelarla cuando sea posible y dejar TTL como respaldo.
6. Nombre, datos profesionales y foto son operaciones separadas en esta propuesta.
   Si se guardan desde un mismo pie de formulario, manejar éxito parcial: informar
   exactamente qué quedó persistido y qué falló, reconsultar cuenta/perfil y
   conservar el borrador pendiente. No anunciar «todo guardado» tras solo subir
   bytes. Si el equipo exige atomicidad conjunta, acordar otro contrato antes.

### AuthContext, imágenes y vistas públicas

Extender `obtenerSesion`/GET propio para recuperar foto y revisiones al iniciar y
recargar. Adaptar AuthContext: actualmente la foto PRESTADOR siempre proviene de
su GET profesional y podría sobrescribir una foto común nueva. Acordar una fuente
única para ambos roles, mantener fallback legado y proteger por usuario, token y
secuencia de petición. Eventos o respuestas anteriores no deben restaurar datos
después de logout, cambio de cuenta o una actualización posterior.

Extender AvatarSesion para mostrar imagen de CLIENTE cuando el contrato la
devuelva, sin llamar al perfil profesional de un cliente. PerfilCliente también
debe usar la foto confirmada. Reutilizar FotoPrestador/estética circular para URL
HTTPS y sus iniciales ante fallos; renovar URLs firmadas con el mecanismo acordado.
No guardar bytes, File u Object URL en JWT/localStorage. Las URLs temporales no
son fuente persistente; los metadatos autoritativos se vuelven a consultar.

Actualizar la foto/nombre en PerfilPrestador, DirectorioPrestadores/
BuscadorPrestadores, FichaPrestadorRemota y DetallePrestador mediante invalidación
o nueva consulta, sin cambiar filtros, ubicación, distancias ni IDs. El mapa
actual no muestra foto en sus popups; conservar su comportamiento. No prometer
sincronización instantánea entre dispositivos sin un canal de eventos contratado;
al volver a consultar deben verse los valores confirmados.

## 8. Criterios de aceptación y persistencia

- Cuenta: ambos roles cambian solo su nombre; otra cuenta, visitante, cuenta
  inactiva y rol no autorizado no pueden hacerlo. DNI/email/rol/id no se alteran.
  Nombre vacío/largo/controles dan error sin perder el dato anterior.
- Respuesta y GET posterior coinciden; nombre e iniciales se sincronizan sin
  alterar el rol ni volver a registrar al usuario. Prestador cambia su nombre
  público desde la misma cuenta, sin duplicarlo en un campo profesional.
- Archivo válido de cada formato y exactamente 5.242.880 bytes puede recorrer
  el flujo; exceso, vacío, MIME falso, SVG/HEIC, imagen corrupta, resolución
  excesiva y metadatos peligrosos se rechazan en servidor. Nunca publicar original.
- Usuario A no prepara/confirma/lee/cancela/borra intención o foto de B. Cambiar
  ids/path/URL/payload no elude permisos; una firma de PUT no concede lectura ni
  borrado. Caducidad, cuotas, repetición y cambio concurrente tienen respuesta definida.
- No cambiar la foto confirmada al seleccionar, cancelar o fallar el upload.
  Fallos de storage, validación y DB conservan el estado correcto; respuesta
  perdida se resuelve consultando/reintentando idempotentemente, sin duplicados.
- Reemplazar/eliminar actualiza avatar, perfil y vistas públicas permitidas;
  limpiar archivos viejos no borra el nuevo ni objetos externos. Tras borrar,
  aparecen iniciales y no vuelve una foto antigua por caché o fallback legado.
- Fotos históricas por URL siguen visibles; datos profesionales se editan sin
  reenviar URL firmada. Cliente no ve campos profesionales y conserva layout.
- Probar firma GET vencida, renovación limitada, imagen fallida, lector de
  pantalla, teclado y tamaños 320/390/768/1365; no mostrar éxito ficticio.
- Con datos autorizados de staging: guardar nombre/foto, verificar GET de cuenta
  y perfil, recargar la página, cerrar sesión, volver a entrar y abrir otra sesión
  del mismo usuario. Debe persistir la misma foto/revisión aunque cambie la URL
  firmada. Otra cuenta no hereda foto ni nombre de la sesión anterior.
- Confirmar que JWT contiene solo sus claims, almacenamiento del navegador no
  contiene bytes/firma persistida, bundle no contiene secretos y logs no los exponen.
  Probar webhooks solo si se adopta ese protocolo: autenticar firma y hacerlos
  idempotentes, sin confiar en un `clienteId`/`usuarioId` enviado por navegador.

Estas son pruebas futuras a implementar cuando exista el contrato. No se crean
tests ni fixtures productivas ni se ejecutan escrituras sobre cuentas reales ahora.

## 9. Orden recomendado de implementación

1. Backend/producto acuerdan alcance personal, privacidad, límites, costes,
   versiones de SDK y DTO/rutas/errores. Publicar Swagger antes de conectar UI.
2. Implementar PATCH propio de nombre y GET de cuenta ampliado, permisos y
   concurrencia. Verificar persistencia y protección de datos sensibles.
3. Aprobar/provisionar almacenamiento y secretos **solo del servidor**, separado
   por entornos. Crear metadatos/intenciones y definir la compatibilidad legado.
4. Implementar subida autorizada, validación/normalización, confirmación,
   lectura, eliminación y limpieza durable; probar fallos e idempotencia.
5. Desplegar soporte backend aditivo y probar staging. Mantener la función nueva
   deshabilitada hasta que todos sus endpoints estén operativos.
6. Integrar servicios/contexto/frontend en el mismo diseño, incluyendo omisión
   de fotoPerfil gestionada en PUT y renovación de URL. Habilitar cliente/fotos
   por capacidad confirmada, sin controles de guardado ficticio.
7. Ejecutar criterios de aceptación, regresiones completas, LCOV y QA; activar
   gradualmente con métricas y rollback que preserve datos e imágenes anteriores.

## 10. Decisiones que debe cerrar backend/producto

1. ¿Solo nombre personal, o se autorizará algún otro campo? ¿Se acepta el límite
   propuesto de 100 caracteres y cómo se conservan nombres históricos mayores?
2. ¿Se aprueban rutas/DTO planos, revisiones independientes, If-Match,
   idempotencia y códigos de error propuestos?
3. ¿Qué almacenamiento, plan/coste, región y versiones compatibles de SDK se
   autorizan? La recomendación Vercel Blob no implica contratación/configuración.
4. ¿Privacidad de fotos de cliente y difusión pública del prestador? ¿Se aceptan
   enlaces firmados de 15 minutos como capacidades compartibles, o se necesita
   proxy autenticado? ¿Se prefieren derivadas públicas para prestadores?
5. ¿Se aprueban 5 MiB, formatos, dimensiones, variante final, GIF sin animación
   y rechazo de HEIC? Alinear mensajes del selector y validación del servidor.
6. ¿Fuente común de foto, migración/fallback y política del PUT legado? ¿Qué se
   permite para nuevas URLs externas, HTTP histórico y eliminación de referencias?
7. ¿Quién opera limpieza, cuotas, observabilidad y reintentos durables? ¿Qué TTL,
   retención, revocación y procedimiento de recuperación se comprometen?
8. ¿Confirmación síncrona es suficiente? Si no, definir proceso durable y su
   contrato. ¿Se acepta éxito parcial entre nombre/datos profesionales/foto o se
   exige una operación transaccional conjunta adicional?

Hasta resolver y desplegar lo anterior, no habilitar edición persistente del
cliente ni subida real desde SelectorFotoPerfil. Este contrato es la base de
acuerdo para backend y la posterior integración; no afirma que ya estén listos.

Validación de esta entrega: contratos contrastados con Swagger y código, ejemplos
JSON y enlaces locales comprobados, sin errores de espacios. `git diff --check`
correcto. Único archivo nuevo: este documento; sin cambios de código, tests o CI,
y sin commit, push o PR en la rama `docs/contrato-perfiles-imagenes`.
