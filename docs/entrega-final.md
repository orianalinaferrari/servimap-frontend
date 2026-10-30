# Entrega universitaria — auditoría del 29/10/2026

Base auditada: `feature/release-servimap`, `e56b0ab216efa57a120a2b1ea0ae6edda3a3faa8`, inicialmente limpia y sincronizada. PR [#29](https://github.com/orianalinaferrari/servimap-frontend/pull/29) abierto en borrador hacia `develop`. El commit de esta documentación se consulta con `git log -1 --oneline`.

**Dictamen:** frontend preparado para presentar con límites explícitos. La aceptación funcional completa y la publicación real siguen pendientes. No se encontraron defectos funcionales prioritarios reproducibles en el alcance revisado; no se modificaron código, dependencias, backend ni datos productivos.

## Alcance y trazabilidad

Se contrastaron rutas, servicios HTTP, sesión, componentes y pruebas con el [README del backend](https://github.com/valenbalda/servimap-backend/blob/develop/README.md) y su [matriz RF-01 a RF-23](https://github.com/valenbalda/servimap-backend/blob/develop/docs/qa/trazabilidad.md), consultados durante esta auditoría. No se dispone aquí de otra rúbrica universitaria aprobada; esta matriz es la referencia verificable y no sustituye la aceptación de la profesora.

| Requisitos | Implementación frontend | Evidencia y límite |
| --- | --- | --- |
| RF-01/02: registro y sesión | DNI, CLIENTE/PRESTADOR, login JWT, logout local y expiración | Componentes/HTTP simulados; GET real de sesión sin credencial o con Bearer malformado: 401. Sin login/registro reales. Logout no revoca el JWT en servidor. |
| RF-03/04: perfil y oficios | Edición de perfil, contactos, precios, disponibilidad, coordenadas y oficios | Probado con mocks; guardado y persistencia reales pendientes. |
| RF-05: mapa | MapLibre, Liberty/OpenFreeMap, créditos, popup/ficha, indicaciones y geolocalización voluntaria | Marcadores y geolocalización simulados; endpoint real con 0 marcadores. Evidencia previa de cartografía real cargada. |
| RF-06/07: filtros y búsqueda | Texto, oficio, calificación y disponibilidad en API; zona/precio sobre resultados actuales | Mocks y lecturas públicas reales. **RF-06 parcial: no hay filtro de distancia/radio en la UI**, aunque el backend admite lat/lng/radioKm. Centrar el mapa no filtra por cercanía. |
| RF-08: ficha | Contacto, reputación y comentarios públicos | GET real de ficha y contrato; contenido con comentarios/reputación representativos probado con mocks. |
| RF-09 a RF-15: solicitudes | Crear/listar; prestador acepta/rechaza/finaliza; cliente cancela PENDIENTE o ACEPTADA | Componentes y contratos simulados; GET protegido real: 401. Ciclo con usuarios y persistencia real pendiente. |
| RF-16 a RF-18: calificación | Una calificación de 1–5 y comentario ≤500 para FINALIZADA | Mocks; duplicación/persistencia real pendientes. Existe servicio de edición de comentario, **sin interfaz para editarlo**; tras recarga solo se conoce `calificada`, sin detalle en la lista. |
| RF-19 a RF-21: reputación y comentarios | Promedio y trabajos finalizados de la API; comentarios públicos y recibidos por prestador | Mocks y estructura pública real; lecturas autenticadas válidas y datos representativos reales pendientes. |
| RF-22/23: administración | Alta/edición/desactivación de oficios y moderación con motivo | Mocks; rechazos reales 401. Permisos con JWT válido y persistencia pendientes. |

Diferencias aceptadas por el contrato actual, sin prometer funciones inexistentes: nombre y apellido en un campo; sin edición de cuenta del cliente, propuestas/presupuestos ni fecha preferida; finalización directa por el prestador, sin confirmación del cliente. Directorio limitado a 50 por consulta y mapa a 200; con filtros, los marcadores se restringen a los resultados del listado. No se garantiza exhaustividad por zona/precio ni búsqueda geográfica ilimitada.

## Rutas y calidad de interfaz

- Públicas: `/`, `/login`, `/registro`; `/acceso-denegado` y fallback para URL inexistente. La ficha se abre desde listado/mapa, sin URL propia.
- CLIENTE: `/cliente`, `/cliente/solicitudes`. PRESTADOR: `/prestador`, `/prestador/solicitudes`, `/prestador/perfil`, `/prestador/oficios`. ADMINISTRADOR: `/admin`.
- Las rutas protegidas revalidan la sesión y distinguen ausencia de sesión, rol incorrecto y error de red. La autorización efectiva depende del servidor.
- Evidencia previa: responsive sin overflow a 320/390/768/1365 px, formularios etiquetados, objetivos táctiles y popup móvil revisados. Código con foco visible, controles de teclado y mensajes `status`/`alert`. No equivale a certificación WCAG ni revisión con lector de pantalla; quedan contraste y recorrido manual completo por teclado como aceptación pendiente.

## Evidencia de esta ejecución

Con Node **24.22.2** de la caché local, sin cambiar el Node del sistema (22.19.0):

| Comprobación | Resultado |
| --- | --- |
| `vitest run --reporter=dot --maxWorkers=2` | **407/407**, 51 archivos, sin omisiones; API simulada. Avisos esperados de WebGL en jsdom y un aviso de mock de Vitest. |
| Lint, build y diff | ESLint y Vite aprobados con Node 24.22.2; `git diff --check` sin errores. Solo aviso conocido de tamaño del chunk MapLibre. |
| `scripts/qa/build-estatico.mjs` | **12 rutas SPA y 9 archivos** aprobados, incluido worker MapLibre; sin env privados ni sourcemaps en dist. Preview local, no verifica Vercel remoto. |
| GET reales, `scripts/qa/lecturas-reales.mjs` | **9 aprobados**: salud/catálogo/directorio/mapa/ficha 200 y protegidos 401; 1 oficio, 1 prestador, 0 marcadores. |
| `scripts/qa/cors-permisos-reales.mjs` | **26 aprobados**: preflights, rechazo de 3 orígenes y lecturas protegidas sin JWT válido. Solo GET/OPTIONS. |
| `npm audit --json` | **3 dependencias con avisos altos**, 0 críticos: Vite, undici y zod; `npm explain` confirma uso de desarrollo. Hallazgo abierto DEF-06, no se aplicó actualización amplia sin defecto explotable reproducido. |
| Secretos | Sin coincidencias de patrones de claves privadas/tokens GitHub/URLs PostgreSQL en fuentes, recursos públicos, CI y env versionados revisados. `.env.local` ignorado; solo `.env.example` y `.env.production` versionados. No cubre todo el historial. |

Las **64 verificaciones Chrome con API simulada** y las **57 de navegación pública con API real** son evidencia anterior documentada en [release](release-servimap.md) y [validación](validacion-final.md); no se repitieron porque el código funcional no cambió. No deben presentarse como login, escrituras o permisos reales certificados.

## Ejecución y despliegue

1. Usar Node 24.x. Desde este repositorio: `npm ci`.
2. Crear `.env.local` desde `.env.example` solo si no existe; `VITE_API_URL` debe ser el origen sin `/api` ni credenciales. Para la demostración pública: `https://servimap-backend.vercel.app`.
3. `npm run dev -- --host localhost --port 5173 --strictPort`; abrir `http://localhost:5173`. CORS de 5174 no está autorizado. No exponer el servidor de desarrollo públicamente.
4. Calidad: `npm test -- --maxWorkers=2`, `npm run lint`, `npm run build`, `git diff --check`. `npm run preview -- --host localhost --port 4173 --strictPort` sirve el artefacto local; 4173 no queda habilitado en CORS por ese comando.
5. Despliegue: seguir [la guía Vercel](despliegue-servimap.md), usando el checkout y commit de **feature/release-servimap**, Node 24, `npm ci`, build `npm run build`, salida `dist` y rewrite SPA existente. No se desplegó durante esta revisión.
6. Antes de publicación: preview autorizada, CORS del origen HTTPS exacto y comprobación remota de assets, worker, mapa, navegación y refresh de rutas protegidas. Usar API/base aislada para pruebas autenticadas; no operar formularios reales contra producción.

JWT en `sessionStorage`, sin DNI persistido; firma/roles se validan en backend. El popup usa `textContent` y no HTML de usuarios. La ubicación del visitante se solicita voluntariamente y se usa localmente; los marcadores proceden del endpoint público aproximado. La seguridad revisada es básica: no constituye pentest. Permanece el aviso de tamaño del chunk de MapLibre; no impide compilar.

## Guion para la profesora — 4 minutos

1. **0:00–0:40:** explicar el problema y los tres roles; abrir inicio, catálogo y filtros. Aclarar que la API pública contiene pocos datos.
2. **0:40–1:20:** abrir ficha y mapa Liberty, mostrar créditos y explicar ubicación aproximada. Si el mapa está vacío, mostrar el estado vacío y la evidencia de marcadores simulados; no afirmar que hay ubicaciones reales verificadas.
3. **1:20–2:00:** mostrar login/registro, DNI y selección de rol sin enviar formularios; entrar a `/admin` sin sesión para demostrar redirección. Explicar JWT y control de permisos del servidor.
4. **2:00–3:20:** describir CLIENTE crea → PRESTADOR acepta/finaliza → CLIENTE califica; luego oficios y moderación del administrador. Demostrar con cuentas únicamente en API aislada autorizada. Si no está disponible, presentar los tests y la evidencia Chrome como **simulación**, sin inventar sesiones.
5. **3:20–4:00:** mostrar resultados, límites RF-06, edición de comentarios y pendientes de publicación. El PR permanece en borrador.

## Checklist de aceptación

- [x] Rama y commit inicial verificados; autoría existente conservada.
- [x] Funcionalidades y RF contrastados; diferenciados mocks, GET reales y evidencia previa.
- [x] Tests unitarios/de componentes aprobados; sin escrituras productivas.
- [x] Lint, build, smoke del artefacto y diff aprobados.
- [x] Instrucciones de ejecución/despliegue y guion preparados; corregida referencia a la rama vieja de despliegue.
- [ ] Acordar alcance parcial de RF-06 y ausencia de UI de edición de comentarios con la profesora/equipo.
- [ ] Resolver DEF-06 con parches acotados y regresión; completar aceptación manual de accesibilidad.
- [ ] Proveer cuentas de los tres roles y API/base aislada; validar JWT, titularidad y persistencia real de todos los flujos.
- [ ] Validar marcadores reales con coordenadas de prueba autorizadas.
- [ ] Generar/verificar preview, CORS definitivo y navegación/refresh remotos antes de publicar.

El cumplimiento de estas tareas pendientes es necesario para declarar aceptación integral y publicación real. La documentación histórica conserva fechas, responsables y resultados originales.
