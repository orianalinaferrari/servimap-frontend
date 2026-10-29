# Integración de ServiMap con el backend

## Referencia y alcance

Rama frontend: `feature/integracion-backend-servimap`, desde `7f6fd86` de `feature/google-maps-servimap`. Backend inspeccionado en un clon temporal externo, sin cambios: `valenbalda/servimap-backend`, commit `f47eecd` (rama predeterminada `develop`). Se revisaron Swagger, rutas, controladores, servicios, permisos y `prisma/schema.prisma`; la documentación publicada también responde y contiene las rutas de mapa y solicitudes.

No se crearon usuarios, solicitudes ni calificaciones en producción. Los tests interceptan HTTP; el setup impide solicitudes reales no simuladas. Los mocks históricos se conservan como fixtures de pruebas, sin importaciones desde App ni flujos de producción. Las utilidades antiguas de almacenamiento local ya no se usan para perfiles, oficios o administración.

## Configuración y ejecución

Copiar `.env.example` a `.env.local` (ignorado por Git), sin sobrescribir configuraciones personales:

```dotenv
VITE_API_URL=https://servimap-backend.vercel.app
```

Guardar en UTF-8 sin BOM. Vite 8 no reconoció la primera variable de un archivo con BOM; se verificó su lectura con `loadEnv`. La URL es el origen, **sin `/api` al final**; las rutas se centralizan en servicios. No se requieren variables por endpoint ni claves cartográficas.

Ejecutar `npm run dev -- --port 5173 --strictPort`. La API permite actualmente `http://localhost:5173`; **no permite `http://localhost:5174`**. No se cambió el CORS del backend ni se agregó un proxy que lo oculte. El dominio definitivo de despliegue deberá ser autorizado por su responsable. Si un Vite antiguo devuelve HTTP 504 al importar React/MapLibre después de instalar dependencias, reiniciar únicamente ese servidor con `--force`; no hace falta borrar código ni archivos privados.

## Contratos usados

Los IDs de usuario, perfil de prestador, oficio y solicitud son strings distintos. El ID del perfil de prestador se utiliza para ficha, mapa y solicitudes; nunca se reemplaza por el ID del usuario.

| Operación | Endpoint | DTO / respuesta y permisos |
| --- | --- | --- |
| Registro | POST `/api/auth/register` | `{nombre,dni,email,password,rol}` → usuario, 201. DNI normalizado sin puntos/espacios, 7–8 dígitos; password ≥8; rol CLIENTE/PRESTADOR. 409 para DNI/email duplicados. |
| Login | POST `/api/auth/login` | `{email,password}` → `{token,usuario}`. 400/401/403. |
| Sesión | GET `/api/auth/me` | Bearer → usuario con DNI del dueño; 401/404 invalidan sesión. |
| Catálogo | GET `/api/oficios` | Array de oficios activos `{id,nombre,categoria,activo}`, público. |
| Directorio | GET `/api/prestadores` | Filtros `q`, `oficioId`, `calificacionMin`, `disponible`, `limit` (máx. 50). Oficios por objeto y reputación se adaptan a la UI existente. |
| Ficha | GET `/api/prestadores/:id` | Datos públicos, contactos, reputación, comentarios sin moderados. |
| Mapa | GET `/api/prestadores/mapa` | Público, hasta 200 disponibles; coordenadas ya redondeadas a 2 decimales y `oficioPrincipal`. Nunca se consulta `/me` para construir marcadores. |
| Perfil | GET/PUT `/api/prestadores/me` | PRESTADOR. PUT: descripción profesional, foto, zona, coordenadas numéricas, precios, teléfono, WhatsApp, email de contacto y disponible. |
| Oficios propios | PUT `/api/prestadores/me/oficios` | PRESTADOR, `{oficioIds:[...]}`; reemplaza selección. Lista vacía permitida. |
| Comentarios recibidos | GET `/api/prestadores/me/calificaciones` | PRESTADOR, array sin moderados. |
| Crear solicitud | POST `/api/solicitudes` | CLIENTE, `{prestadorId,oficioId,descripcion,direccion?,contactoPreferido?}`. PENDIENTE, 201. Descripción 1–1000. |
| Mis solicitudes | GET `/api/solicitudes` | CLIENTE/PRESTADOR, array con oficio, cliente/prestador resumidos y `calificada`. |
| Transiciones | PATCH `/api/solicitudes/:id/aceptar`, `/rechazar`, `/finalizar`, `/cancelar` | Prestador dueño acepta/rechaza PENDIENTE y finaliza ACEPTADA; cliente dueño cancela PENDIENTE o ACEPTADA. Se vuelve a consultar la lista tras confirmar. 403/404/409 preservan el estado previo. |
| Calificación | POST `/api/calificaciones` | CLIENTE dueño, `{solicitudId,puntaje,comentario}`; FINALIZADA y no calificada. Puntaje entero 1–5, comentario ≤500. |
| Editar comentario | PATCH `/api/calificaciones/:id/comentario` | Servicio disponible para comentario propio no moderado. La UI solo dispone del detalle recién creado; ver limitaciones siguientes. |
| Moderación | GET `/api/calificaciones`; PATCH `/api/calificaciones/:id/moderacion` | ADMINISTRADOR. PATCH `{motivo}` no vacío, ≤200. Lista actualizada únicamente tras respuesta exitosa. |
| Administración de oficios | GET `/api/oficios/todos`, POST `/api/oficios`, PUT `/api/oficios/:id`, PATCH `/api/oficios/:id/estado` | ADMINISTRADOR. Escritura de nombre; estado `{activo:boolean}`. No se borra el oficio. Categoría es opcional y el servicio la admite. |

## Sesión y HTTP

JWT guardado en `sessionStorage`, limitado a la pestaña, sin persistir datos del usuario ni DNI. Como todo almacenamiento accesible a JavaScript, depende de prevenir XSS; no es un secreto del servidor y no se imprime en logs. La firma y los permisos los valida siempre el backend: decodificar `exp` solo permite anticipar expiración en la interfaz. La recuperación consulta `/api/auth/me`, sin confiar en el rol almacenado localmente.

El cliente envía `Authorization: Bearer` en operaciones autenticadas y `credentials: omit`; login, registro y GET públicos no envían token. Logout elimina la sesión local: no existe `/auth/logout` remoto. Un 401 protegido elimina el JWT vigente y avisa a React; 403 conserva la sesión y muestra falta de permiso. Se respeta `{error}` de respuestas 400/401/403/404/409/500, con mensajes de respaldo y error de red. Expiración por temporizador y revalidación de rutas mantienen los paneles protegidos. No hay endpoint de refresh.

## Diferencias explícitas respecto del prototipo

- El backend tiene un solo `nombre`: el registro solicita nombre y apellido juntos. No acepta apellido o teléfono en registro. El teléfono/contacto puede editarse en el perfil del prestador; no hay endpoint para editar datos de cuenta o teléfono del cliente. No se finge guardar campos no admitidos.
- No existe fecha preferida de solicitud: se reemplazó por contacto preferido admitido, sin enviar campos ignorados. La dirección es opcional.
- No existe finalización en dos etapas ni confirmación del cliente: el prestador finaliza directamente una ACEPTADA. Se retiró esa acción ficticia del cliente. El cliente puede cancelar también ACEPTADAS.
- No existen propuestas o presupuestos: no se implementaron.
- El perfil privado admite coordenadas exactas; solo su dueño las ve al editar. El mapa usa exclusivamente `/api/prestadores/mapa`, sin mezclarlas con el perfil privado.
- El backend limita el directorio a 50 por búsqueda y el mapa a 200. Se aplican filtros de oficio/texto/calificación/disponibilidad en la API; zona y precio siguen filtrando los resultados actuales en frontend porque no son filtros del contrato. No hay cursor/paginación para prometer un catálogo ilimitado.
- `/api/solicitudes` devuelve `calificada`, pero no el ID/puntaje/comentario de esa calificación. Tras recargar se puede impedir duplicarla; no recuperar su detalle ni editarla desde esa lista sin ampliar el contrato. El servicio de edición existe, sin inventar un endpoint de consulta del cliente. Tampoco se inventan nombres de clientes en comentarios públicos; administración muestra IDs si no vienen nombres.
- Campos numéricos vacíos en edición se omiten para conservar el valor: la validación actual del backend no acepta `null` para borrarlos.

## Validación y pendientes

Pruebas de contrato HTTP y componentes para JWT, registro/DNI, catálogo, selección desde mapa, ficha, errores, oficios/perfil, solicitudes, finalización, calificaciones y moderación; además de las pruebas existentes actualizadas a contratos reales. No dependen de credenciales ni de la API de producción.

GET reales verificados: `/health` y Swagger 200, `/api/oficios` 200 (1 oficio), `/api/prestadores?limit=50` 200 (1 prestador), `/api/prestadores/mapa` 200 (0 marcadores), `/api/auth/me` 401 sin token (esperado). CORS confirmado para 5173 y rechazado para 5174. Los conteos describen el momento de la auditoría, no fixtures ni garantías de contenido.

Pendiente con cuentas de prueba autorizadas y un entorno adecuado: registro/login de los tres roles, revalidación JWT contra el servidor, guardar perfil/oficios, todo el ciclo de solicitudes y calificaciones, moderación y administración. No se ejercitan escrituras sobre producción. El mapa no puede mostrar marcadores reales mientras el endpoint público no devuelva coordenadas; no se agregaron ubicaciones artificiales.

### Resultado de esta ejecución

- **384 pruebas aprobadas en 50 archivos** (base anterior: 347). Se sustituyeron las expectativas de cookies/endpoints configurables, almacenamiento local y finalización en dos etapas por pruebas de los contratos reales; se agregaron pruebas HTTP y de componentes. No se omitieron suites ni se usaron escrituras reales para que pasaran.
- Lint, build y `git diff --check` correctos. Build conserva el aviso conocido del tamaño del chunk de MapLibre, importado dinámicamente.
- Chrome real en `http://localhost:5173`: directorio con el prestador público existente, catálogo, mapa Liberty con créditos y ficha remota verificados sin errores de consola ni alertas; GET de catálogo, prestadores, mapa y ficha respondieron 200. No se enviaron formularios. La API devuelve actualmente cero marcadores públicos.
- Los cambios quedan sin commit ni push en la rama de integración. Backend y ramas originales sin modificaciones.


### Auditoria QA final

Se volvieron a contrastar rutas, Swagger, Prisma, controladores de autenticacion/perfil/calificaciones, middleware JWT y servicios de solicitudes/mapa con GitHub; los hashes coinciden con la referencia temporal. Se corrigio un defecto reproducido por tres pruebas inicialmente fallidas: el PUT del perfil enviaba contactos y descripcion vacios que el controlador rechaza. Ahora se omiten cuando aun no estaban configurados, se impide borrar valores existentes con cadenas vacias y se valida el formato telefonico real. Se agregaron cinco pruebas de transiciones desde componentes con HTTP simulado.

Ver checklist y evidencia de la validacion en [QA de integracion](qa-integracion-backend.md).
