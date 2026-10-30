# Preparación para Vercel — 29/10/2026

Base: `feature/validacion-final-servimap`, commit `1074c960685666979f9b85575e7eb237c9c44704`, limpia y sincronizada antes de crear `feature/deploy-servimap`. No se modificaron backend, otras ramas, cuentas ni producción.

## Configuración preparada

| Ajuste | Valor |
| --- | --- |
| Framework / raíz | Vite / raíz de este repositorio |
| Node | `24.x`, declarado en `package.json`, lockfile y `.nvmrc`; coincide con el major del CI |
| Instalación | `npm ci`, con `package-lock.json` existente y sin actualizar dependencias |
| Build / salida | `npm run build` / `dist` |
| API | `VITE_API_URL=https://servimap-backend.vercel.app` |
| SPA | `vercel.json`: rewrite de rutas a `/index.html` para enlaces directos y refresh; sin proxy al backend |
| Mapas | MapLibre, worker propio emitido por Vite, estilo Liberty de OpenFreeMap y créditos existentes; sin API key |

La API debe ser **el origen sin `/api` ni barra final**, sin credenciales, query o fragmento. `src/services/apiClient.js` agrega rutas como `/api/auth/me`; configurar `/api` en la variable duplicaría el prefijo. `.env.production` versiona únicamente esta URL pública y se usa durante `vite build`, tanto para Preview como para Production. Vercel puede sobrescribir `VITE_API_URL` mediante sus variables de build. Un cambio de variable requiere otro build; no es configuración dinámica en el navegador. No se cambió `.env.local`.

Todas las variables `VITE_*` son públicas en el bundle. No agregar `JWT_SECRET`, claves de base, tokens Vercel/GitHub ni credenciales al frontend. `.gitignore` y `.vercelignore` excluyen entornos privados y `.vercel/`; se conservan como excepciones únicamente `.env.example` y `.env.production`, ambos públicos. Vercel publica `dist`, no la raíz del checkout. No se emiten sourcemaps de producción ni archivos `.env` en `dist`. JWT sigue siendo de sesión, nunca una variable de build.

El fallback sigue la [guía oficial de Vite en Vercel](https://vercel.com/docs/frameworks/frontend/vite). Los assets existentes deben servirse como archivos, no como HTML. La prueba local verifica ese comportamiento de Vite preview; todavía falta comprobarlo en Vercel. Node 24 es una versión disponible y puede fijarse con `engines` según la [documentación de Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

## Acceso y resultado remoto

**No se generó ni verificó una preview. No hay URL u origen de preview confirmado.** No se puede afirmar que el proyecto no exista: faltan permisos de lectura de la cuenta Vercel.

- No hay `.vercel/project.json`, CLI instalada ni sesión en las ubicaciones habituales de Vercel de esta notebook; tampoco variables `VERCEL_*`/`NOW_*` en esta sesión.
- El commit base no tiene estados/checks de Vercel en GitHub. Esto tampoco prueba ausencia de un proyecto.
- Existe una integración Vercel disponible, pero no está instalada/conectada. Se indicó esa opción; no se modificaron cuentas ni se hizo login, vinculación, importación o despliegue automático.
- No se publicaron ni promovieron deployments de producción. No se añadieron dominios ni se modificó `CORS_ORIGIN`.

## Pasos manuales para desbloquear la preview

1. Instalar y conectar Vercel en este entorno, o iniciar sesión con la CLI oficial desde PowerShell: `npx.cmd vercel@latest login`. Completar la autorización en el navegador con la cuenta/equipo que administre el frontend, sin compartir credenciales en el chat.
2. En el dashboard, confirmar un proyecto **existente del frontend**, su equipo, repositorio y Production Branch. No elegir el proyecto del backend. Si no existe, detenerse y coordinar una nueva vinculación autorizada: no importar ni hacer un primer deploy a ciegas. La [guía de CLI](https://vercel.com/docs/cli/deploying-from-cli) advierte que el primer despliegue de un proyecto nuevo puede ser Production incluso sin `--prod`.
3. Si el proyecto ya existe y está habilitado para previews, vincularlo con `npx.cmd vercel@latest link`: seleccionar el equipo correcto y responder que se vincula un proyecto existente. No aceptar creación automática. Confirmar Vite, raíz del repo, Node 24, instalación/build/salida de la tabla. No cambiar Production Branch ni dominios de producción.
4. En las variables **Preview** del proyecto, confirmar `VITE_API_URL=https://servimap-backend.vercel.app`. Si hay un override por rama, revisar `feature/release-servimap`, la rama vigente de entrega. El archivo público sirve de valor de build predeterminado. No modificar variables de Production durante esta preparación.
5. Desde un checkout limpio de `feature/release-servimap` y con el proyecto existente confirmado, ejecutar `npx.cmd vercel@latest deploy --target=preview --meta githubCommitRef=feature/release-servimap`. No usar `--prod`, `promote` ni despliegues temporales. Verificar en el dashboard que el deployment diga **Preview** y corresponda al commit local de esta rama; la metadata por sí sola no selecciona el código a desplegar. Referencia: [CLI deploy](https://vercel.com/docs/cli/deploy).
6. Copiar la URL exacta que devuelva Vercel. Si tiene Deployment Protection, acceder mediante la sesión autorizada; no desactivar protección ni publicar tokens de bypass.

## Origen exacto y CORS

No inventar un hostname ni solicitar comodines `*.vercel.app`. Tras generar la preview, derivar su origen real en PowerShell:

```powershell
$previewUrl = Read-Host 'Pegá la URL HTTPS real de la preview'
$previewOrigin = ([uri]$previewUrl).GetLeftPart([System.UriPartial]::Authority)
$previewOrigin
```

Enviar a las responsables del backend: **«Agregar el origen HTTPS exacto impreso a `CORS_ORIGIN`, conservando los orígenes ya permitidos, y aplicar la configuración en el backend. Solo necesitamos GET y preflight para esta validación; no se autorizaron escrituras de prueba en producción.»** Si se usa un alias de rama además de la URL única del deployment, comprobar e incluir cada origen realmente utilizado. No se envió este mensaje automáticamente.

Verificar desde la preview los GET de `/api/oficios`, `/api/prestadores` y `/api/prestadores/mapa`. Para el preflight, ejecutar únicamente OPTIONS:

```powershell
curl.exe -i -X OPTIONS 'https://servimap-backend.vercel.app/api/auth/me' -H "Origin: $previewOrigin" -H 'Access-Control-Request-Method: GET' -H 'Access-Control-Request-Headers: authorization,content-type'
```

Esperar 204, `Access-Control-Allow-Origin` igual al origen real, Authorization/Content-Type permitidos y `Vary: Origin`. OPTIONS no equivale a probar autenticación válida. No enviar tokens, formularios ni POST/PUT/PATCH/DELETE a producción. CORS de localhost no certifica CORS de Vercel y no se agregó un proxy para evitarlo.

## Evidencia local y pendiente

- **402/402 tests, 51 archivos; lint y build correctos con Node `24.22.2`** obtenido temporalmente, sin cambiar Node del sistema. Persiste únicamente el aviso conocido del tamaño de MapLibre. No se modificaron diseño, componentes, roles o funcionalidades.
- `node scripts/qa/build-estatico.mjs`, después del build: **12 rutas SPA y 9 archivos** correctos con Vite preview local en puerto exclusivo 4173, incluyendo JS/CSS, iconos, fuente y worker MapLibre. Comprueba API pública incorporada y ausencia de archivos privados/sourcemaps/patrones de secretos en el artefacto. Solo HTTP local, sin contactar el backend; detiene su propio servidor al terminar. Esto no emula ni certifica la infraestructura de Vercel.
- `node scripts/qa/cors-permisos-reales.mjs`: **26 controles aprobados**, GET/OPTIONS reales únicamente; `localhost:5173` permitido y los tres orígenes no autorizados del runner rechazados. No se usó una identidad válida ni se realizaron escrituras.
- `npm.cmd run qa:read`: **9 GET reales correctos**, salud y recursos públicos 200, recursos protegidos 401 esperado; 1 oficio, 1 prestador y 0 marcadores al ejecutar. Sin escrituras.
- `git diff --check` correcto; revisión por patrones de secretos sin hallazgos en fuentes/artefacto y `.env.local` ignorado, fuera del índice. La revisión por patrones no garantiza todo el historial.
- Pendiente en la URL real: home, JS/CSS/iconos/fuente/worker, navegación y refresh directo de `/login`, `/registro`, `/cliente/solicitudes`, `/prestador/perfil`, `/admin`, controles de sesión sin credenciales, Liberty/créditos y consola sin errores. Luego de autorizar CORS, verificar GET públicos desde ese origen. No se declaran estas pruebas remotas aprobadas.
- Los flujos reales con cuentas de los tres roles, persistencia y marcadores siguen bloqueados por falta de entorno/cuentas de prueba autorizados; ver [QA final](validacion-final.md). No se crean marcadores artificiales en producción.

**Preparación técnica terminada.** El siguiente paso requiere acceso al proyecto Vercel, generar una preview y autorizar su origen exacto en el backend. No se certifica una preview ni una liberación a producción.
