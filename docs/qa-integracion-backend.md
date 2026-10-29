# QA final de integración con backend

## Estado técnico

Rama `feature/integracion-backend-servimap`; cambios locales sin commit, push ni merge. Base `7f6fd86`. Contratos cotejados de nuevo con los archivos actuales de GitHub y la referencia temporal externa: rutas, Swagger, Prisma, controladores, servicios y middleware JWT coinciden. Ningún cambio en backend, Neon ni Vercel.

- API configurada mediante `VITE_API_URL=https://servimap-backend.vercel.app`; Vite la lee correctamente. `.env.local` está ignorado por Git y solo se expone la variable pública de origen.
- El servidor existente en `http://localhost:5173` responde: se reutiliza sin detenerlo ni interrumpir procesos. No se cambia de puerto automáticamente.
- Sin mocks en el grafo de módulos productivo desde `src/main.jsx`; las fixtures y utilidades locales conservadas solo se usan en pruebas. Sin rutas, servicios o propuestas/presupuestos inventados. El presupuesto como filtro de precios del directorio sí es una funcionalidad válida.
- Cliente HTTP centralizado con Bearer y sin cookies; permisos reales del servidor, revalidación de sesión, expiración y logout local. No hay registros de JWT, headers Authorization o DNI en los servicios/contextos.

## Evidencia GET real (sin sesión)

Se consultaron exclusivamente GET, sin enviar credenciales ni datos personales. Con `Origin: http://localhost:5173`, CORS devuelve el mismo origen.

| Consulta | Resultado | Comprobación |
| --- | --- | --- |
| `/health` | 200 | `status: ok` |
| `/api/oficios` | 200, 1 elemento | Array, IDs/nombres de texto y activo booleano |
| `/api/prestadores?limit=50` | 200, 1 elemento | Oficios con IDs, reputación y precios/coordenadas numéricos o nulos |
| `/api/prestadores/mapa` | 200, vacío | Sin inventar ubicaciones; estructura no vacía contrastada con servicio backend y mocks HTTP |
| `/api/prestadores/:id` | 200 | Ficha del ID existente, oficios, comentarios y reputación |
| `/api/auth/me` | 401 esperado | Error JSON, no revela sesión |
| `/api/solicitudes` | 401 esperado | Acceso protegido |
| `/api/calificaciones` | 401 esperado | Administración protegida |
| `/api/oficios/todos` | 401 esperado | Administración protegida |

No aparecieron DNI, password, passwordHash ni token en las respuestas públicas verificadas. Los conteos reflejan el momento de la auditoría. No se probó un flujo autenticado real ni un preflight con Bearer, y nunca se enviaron POST/PATCH/PUT/DELETE a producción.

## Defecto corregido y cobertura

Tres regresiones de perfil se reprodujeron antes de la corrección y pasan después: contactos/descripción aún nulos no se convierten en cadenas vacías en PUT; un contacto establecido no se intenta borrar con un valor que el backend rechaza; teléfono/WhatsApp respetan el patrón real. La restricción para borrar contactos es del contrato backend, sin cambios en el servidor.

Se agregaron pruebas de componentes con HTTP simulado para aceptación y finalización directa, rechazo, cancelación de una aceptada y rechazos 403/409 sin cambiar el estado local. Se mantiene la cobertura de DNI, roles, JWT, 400/401/403/404/409/500, sesión, catálogo, mapa, perfiles, calificaciones y moderación. Total: **384 pruebas en 50 archivos**. El setup bloquea llamadas HTTP reales no simuladas.

## Validación ampliada — 29/10/2026

Rama `feature/qa-integracion-servimap`, desde `a399d2a`; sin commit ni push. Se verificó la sincronización antes de crearla. Los resultados anteriores corresponden a la auditoría de integración; esta pasada amplía su cobertura, sin modificar backend ni datos de producción.

### Automatización reproducible

- `npm test`: **402/402 pruebas aprobadas, 51 archivos, ninguna omitida**. Son 18 pruebas más que las 384 de base: 16 de seguridad/contrato del simulador y 2 regresiones del mapa.
- `npm run qa:browser`: **64 verificaciones aprobadas**, Chrome headless instalado, escritorio 1365×1000 y móvil 390×844. Sin dependencias nuevas. Requiere Vite en `http://localhost:5173`; reutiliza el servidor y no detiene procesos ajenos. Puede indicarse un ejecutable con `SERVIMAP_QA_BROWSER` y otro origen exclusivamente local con `SERVIMAP_QA_BASE_URL`.
- Las 190 llamadas a la API, incluidas **22 escrituras**, fueron completamente simuladas. El interceptor satisface todas las solicitudes al origen de la API, aborta ante fallos y bloquea escrituras a otros orígenes. Las fixtures usan dominios `.example.test` y JWT de firma deliberadamente inválida; nunca se transmiten a producción. No se utiliza ninguna cuenta real.
- Recorridos: registro con DNI y validación inválida; login, recarga, expiración, JWT malformado y logout; permisos de los tres roles; búsqueda vacía y ficha; creación/cancelación de solicitudes; aceptación/rechazo/finalización; calificación y moderación; perfil/contactos/oficios/ubicación; creación/edición/activación de oficios; errores HTTP 400/401/403/404/409/500.
- MapLibre y OpenFreeMap Liberty se cargaron realmente en Chrome: estado vacío, marcador con coordenadas públicas aproximadas simuladas, ficha e indicaciones externas, GPS simulado y recentrado. No se solicitó la ubicación personal. Sin excepciones JavaScript ni recursos fallidos en la pasada final.
- Se verificaron etiquetas, teclado básico, objetivos táctiles y ausencia de overflow horizontal en las vistas recorridas. Se inspeccionó la captura móvil del popup: indicaciones accesibles y créditos visibles. Esto no sustituye una auditoría completa con lectores de pantalla ni otros navegadores/tamaños.
- Capturas y reporte JSON se guardan fuera del repositorio en la carpeta temporal `servimap-qa-browser-*` informada por el comando. Última ejecución: `servimap-qa-browser-NkU5dn`.
- `npm run qa:read`: únicamente GET reales sin credenciales; volvió a aprobar las consultas de la tabla anterior y CORS desde `localhost:5173`. Se mantienen 1 oficio, 1 prestador y 0 marcadores en el momento de la consulta. No se verificaron escrituras, preflight autenticado ni permisos con JWT real.
- Lint, build y `git diff --check` aprobados. Persiste únicamente el aviso conocido del tamaño del bundle MapLibre. `.env.local` sigue ignorado y fuera del índice; no se incorporaron secretos ni dependencias.

### Defectos frontend reproducidos y corregidos

1. Enlaces de navegación pública de 17 px: ahora son objetivos táctiles de al menos 44 px, sin cambiar identidad visual ni rutas.
2. Una actualización de resultados remotos recreaba los marcadores y cerraba el popup antes de abrir la ficha: se estabilizan los arrays derivados con memoización; una prueba reproduce la actualización pendiente.
3. El popup móvil podía recortar las indicaciones contra el borde inferior: se ancla arriba del marcador y se reposiciona al abrir, con altura acotada y scroll para contenido largo. Se limpian sus listeners; prueba de regresión y comprobación geométrica en navegador.

## Checklist manual pendiente

Ejecutar solo con cuentas y datos de prueba autorizados en un entorno que permita escrituras de prueba; esta auditoría no autoriza escribir en producción.

### Común

- [ ] Configurar URL/origen permitido y verificar preflight con JSON/Bearer en el entorno elegido.
- [ ] Login válido e inválido, recuperación tras recarga, expiración/401, logout local y bloqueo de URL de otro rol.
- [ ] Revisar móvil, teclado, foco, estados de carga, errores de red y ausencia de datos.

### CLIENTE

- [ ] Registro con DNI válido; errores de DNI/email duplicados y password corto, sin ofrecer rol administrador.
- [ ] Buscar por oficio/texto, abrir ficha y crear una solicitud enviando IDs reales; verificar PENDIENTE.
- [ ] Cancelar PENDIENTE y ACEPTADA con confirmación; impedir operar una solicitud ajena.
- [ ] Calificar FINALIZADA una sola vez, límites 1–5 y 500 caracteres. No ofrecer propuestas, fecha preferida ni confirmación de finalización inexistentes.

### PRESTADOR

- [ ] Guardar un perfil nuevo sin contactos, luego contactos válidos, precios y disponibilidad; comprobar errores de rango/formato y precios invertidos.
- [ ] Asignar/quitar oficios por ID y recuperar datos tras recarga.
- [ ] Aceptar/rechazar PENDIENTE y finalizar ACEPTADA directamente; verificar 403 por titularidad y 409 por estado obsoleto.
- [ ] Con coordenadas de prueba autorizadas, comprobar el mapa público redondeado y que no exponga las exactas del perfil; revisar indicaciones y geolocalización.

### ADMINISTRADOR

- [ ] Usar una cuenta de administrador provista: el registro público no permite crearla.
- [ ] Crear/editar oficio y cambiar activo sin borrarlo; comprobar duplicados y persistencia.
- [ ] Moderar comentario con motivo válido y verificar que desaparezca de la ficha pública, conservando el registro administrativo.
- [ ] Confirmar que cliente/prestador no puedan ejecutar administración aunque alteren la UI.

## Criterio de salida

Listo para un commit técnico de integración si tests, lint, build y diff continúan correctos. **No certificado de punta a punta**: faltan credenciales y datos de prueba autorizados para los flujos con escritura, así como un origen de despliegue con CORS permitido. La API no tiene marcadores actualmente; no se puede comprobar su visualización real sin datos geolocalizados. Se mantiene el aviso conocido del tamaño de MapLibre en build, sin impedir compilar.
