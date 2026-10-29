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
