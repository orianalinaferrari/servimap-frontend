# Preparación de release — 29/10/2026

- Rama: `feature/release-servimap`, desde `733b9a93116fb9007fee4badfbc4f0ee7565f15f` de `feature/deploy-servimap`, inicialmente limpia y sincronizada.
- `origin/develop` en `9a3da5732843a81336fde9b58d7ec2f34579bcd7` ya es ancestro de la base. Se ejecutó el merge exclusivamente en release: `Already up to date`. Sin conflictos ni commit de merge vacío. Segundo fetch al terminar QA confirmó el mismo estado.
- Se conservan todos los commits de develop y sus autorías, incluidos los de Joaquim Oliveira. No se borraron archivos de develop. No se modificaron otras ramas, backend, Neon o producción.

## Correcciones durante la preparación

El runner de Chrome consultaba `document.body` mientras una recarga todavía no había creado el documento. Ahora espera a que exista. Además, un `Invalid InterceptionId.` solo se tolera si `Network.loadingFailed` confirmó la cancelación del mismo `networkId`; cualquier otro fallo de intercepción sigue abortando y bloqueando la petición. Se agregaron cinco casos de seguridad para distinguir cancelación, petición activa, ID ausente y otros errores. No cambió código funcional ni la política que simula toda llamada a la API y bloquea escrituras externas.

## Verificación final

- Node `24.22.2`: **407/407 tests, 51 archivos**, sin omisiones. Comando: `vitest run --reporter=dot --maxWorkers=2`. La corrida paralela inicial agotó memoria; se completó la suite con dos workers y luego Chrome por separado, sin reducir cobertura.
- **64 verificaciones Chrome aprobadas**, cero excepciones JavaScript y recursos fallidos. 201 llamadas y 22 escrituras, todas simuladas. Roles, navegación, responsive, contratos HTTP, errores, solicitudes/calificaciones/administración y Liberty con coordenadas públicas simuladas, popup, créditos y geolocalización de prueba.
- Lint, build y `git diff --check` aprobados. Build conserva el aviso conocido de tamaño de MapLibre. Smoke del artefacto: **12 rutas SPA y 9 archivos**, incluido worker MapLibre, sin archivos privados ni sourcemaps publicados.
- Revisión por patrones de secretos en fuentes/artefacto sin hallazgos; `.env.local` ignorado y fuera del índice. Solo se versiona la URL pública de la API como variable de build. No se volcaron credenciales ni respuestas privadas en logs.

## Bloqueos para el merge definitivo

El PR debe permanecer **draft**. Faltan acceso y preview Vercel, autorización y comprobación CORS del origen exacto y validación del sitio desplegado. Los flujos reales de los tres roles, JWT válido, persistencia y permisos del servidor necesitan cuentas y entorno de pruebas aislado autorizado; los marcadores reales siguen sin certificar. Los recorridos simulados no certifican operaciones autenticadas contra PostgreSQL. No promover deployments ni fusionar el PR hasta resolver estos puntos.

Referencias: [despliegue](despliegue-servimap.md), [validación real disponible](validacion-final.md) y [contratos backend](integracion-backend.md).
