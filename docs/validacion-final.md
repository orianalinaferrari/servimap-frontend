# Validación final desde notebook — 29/10/2026

Rama `feature/validacion-final-servimap`, creada desde `53affcf057a1874c8795c7b3b8190d65ce416d79` con Git limpio y sincronizado. Esta evidencia complementa el [historial QA](qa-integracion-backend.md); no convierte las simulaciones anteriores en flujos reales certificados.

## Entorno inspeccionado

- Frontend local en `http://localhost:5173`, API pública en `https://servimap-backend.vercel.app`. `.env.local` contiene únicamente `VITE_API_URL`, está ignorado y fuera del índice; no se modificó en esta validación.
- No se encontró una API aislada autorizada ni cuentas de los tres roles en la configuración y documentación disponibles. No hay variables de entorno `DATABASE_URL_TEST`, staging o ServiMap adicionales en esta sesión.
- El backend sí documenta pruebas de integración con `DATABASE_URL_TEST`, y su workflow `backend-ci.yml` define PostgreSQL descartable en CI. Eso no proporciona una API E2E accesible desde esta notebook, credenciales de aplicación ni constancia de que una URL de preview use una base aislada. No se lanzaron workflows, migraciones, contenedores ni modificaciones del backend o Neon.
- Referencias consultadas, solo lectura: [README backend](https://github.com/valenbalda/servimap-backend/blob/develop/README.md), [QA/backend](https://github.com/valenbalda/servimap-backend/blob/develop/docs/qa/README.md), [CI/backend](https://github.com/valenbalda/servimap-backend/blob/develop/.github/workflows/backend-ci.yml) y configuración CORS `src/app.js`/`src/config/env.js`.

## Evidencia ejecutada

| Control | Resultado y límite |
| --- | --- |
| `npm.cmd run qa:read` | 9 GET reales: salud, oficios, directorio, mapa y ficha 200; sesión, solicitudes y administración 401 sin credenciales. 1 oficio, 1 prestador, **0 marcadores**, al ejecutar. |
| `node scripts/qa/cors-permisos-reales.mjs` | **26 verificaciones**: 11 preflights OPTIONS con JSON/Bearer para GET/POST/PUT/PATCH, 3 orígenes rechazados y 12 GET protegidos rechazados con 401. |
| CORS real | `localhost:5173` permitido con Authorization y Content-Type, métodos solicitados y `Vary: Origin`. `localhost:5174`, origen HTTPS sintético `.example.test` y `Origin: null` sin permiso. Los OPTIONS de rutas con `:id` son preflights, no operaciones sobre registros. No se envió POST/PUT/PATCH/DELETE. |
| Protección real de lectura | `/api/auth/me`, `/api/prestadores/me`, `/api/prestadores/me/calificaciones`, `/api/solicitudes`, `/api/oficios/todos` y `/api/calificaciones`: sin credencial y con cadena Bearer deliberadamente malformada, 401 con solo `{error}`. No se generaron JWT firmados ni se intentó adivinar cuentas. |
| `node scripts/qa/navegador-lecturas.mjs` | **57 verificaciones** en Chrome con perfil temporal nuevo, API real y bloqueo previo de escrituras/credenciales. Inicio, login, registro y paneles cliente/prestador/admin sin sesión. Redirecciones a login correctas. |
| Responsive y mapa reales | 320/390/768/1365 px: sin overflow horizontal, campos etiquetados. Liberty/OpenFreeMap y créditos cargados, GET desde navegador permitidos por CORS. Mapa vacío coherente con el endpoint; sin ubicación personal ni coordenadas artificiales. Capturas revisadas de inicio y mapa a 320/1365 px. |
| Errores en navegador | Ninguna excepción JavaScript, recurso fallido o respuesta HTTP de error durante esos recorridos. Ninguna escritura o credencial enviada. No se sometieron formularios. |
| Regresión solicitada | **402/402 tests, 51 archivos**, lint, build y `git diff --check` aprobados. Los tests usan HTTP simulado: incluyen errores 400/401/403/404/409/500, expiración, permisos y operaciones por rol. No se volvió a ejecutar el recorrido de 64 verificaciones simuladas, ya documentado; se agregó evidencia pública real. |
| Secretos | Revisión de variables, archivos versionados y patrones de claves privadas/tokens/conexiones: sin hallazgos en los archivos revisados ni secretos añadidos. Solo `VITE_API_URL` se lee desde `import.meta.env`. Este barrido por patrones no equivale a una auditoría completa de secretos del historial. |

Las capturas y el JSON del navegador se guardan fuera del repositorio en `%TEMP%/servimap-qa-lecturas-*`; el comando imprime la ubicación. Los reportes contienen rutas/estados y no cuerpos de respuestas públicas ni credenciales. Los scripts nuevos son de QA; no cambian el código funcional, diseño o dependencias.

## Pendiente para certificar y desplegar

1. Proveer una API de pruebas autorizada con aislamiento de base confirmado y cuentas CLIENTE/PRESTADOR/ADMINISTRADOR. La existencia de CI o una URL de preview no demuestra ese aislamiento.
2. Ejecutar allí registro/login reales, JWT válido y expiración, persistencia tras recarga, titularidad y rechazos entre roles. Sin JWT válido no se certifican los permisos del servidor mediante los rechazos 401.
3. Completar solicitudes, transiciones, calificaciones, perfil/oficios, administración y moderación con persistencia real. Las pruebas simuladas no certifican escrituras en PostgreSQL.
4. Cargar coordenadas de prueba autorizadas en ese entorno y comprobar marcadores públicos redondeados frente al perfil privado, popup/ficha/indicaciones. Con el mapa productivo vacío no se puede certificar ese caso real.
5. Definir el dominio del frontend, autorizar su CORS en el backend por su responsable y validar el sitio desplegado y sus preflights. No se configuró ni publicó ningún despliegue.

Sin defectos frontend nuevos reproducidos; no se hicieron correcciones funcionales. Persisten el aviso de tamaño de MapLibre y Node local `22.19.0`, inferior al mínimo `22.22.2` de algunas dependencias, aunque los controles pasan. Usar una versión compatible antes del despliegue; el CI frontend configura Node 24.

**Resultado:** apto para preparar el despliegue y continuar QA; **no certificado para liberación a producción** hasta cerrar autenticación/persistencia real, permisos de los tres roles, marcadores y CORS del dominio final.
