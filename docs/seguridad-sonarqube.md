# Seguridad, SonarQube y cobertura — 30/10/2026

> La auditoría inicial y sus cifras se conservan como historial. La sección final «Corrección de Actions #28/#29 y PR #31» registra el diagnóstico remoto posterior a publicar `79cb898` y las nuevas correcciones locales. No interpretar los estados anteriores de «sin commit/push/PR» como el estado actual de esa entrega.

Rama local `feature/sonarqube-seguridad-servimap`, creada desde `origin/main` actualizado en `595231f`. Cambios sin commit ni push; no se modificaron backend, diseños ni otras ramas. Se usó Node 24.22.2 temporal porque el Node predeterminado de la notebook es 22.19.0. No se cambió la instalación del sistema.

## Diagnóstico remoto verificable

Proyecto público: [orianalinaferrari_servimap-frontend](https://sonarcloud.io/project/overview?id=orianalinaferrari_servimap-frontend), organización `orianalinaferrari`. Consulta de solo lectura de `api/components/show`, `api/issues/search`, `api/measures/component`, `api/qualitygates/project_status` y `api/hotspots/search`. Último análisis publicado consultado: `2026-10-30T09:45:35+0000`.

| Métrica publicada, anterior a estas correcciones | Valor |
| --- | --- |
| Security / Reliability / Maintainability Rating | C / C / A |
| Vulnerabilidades / bugs / code smells abiertos | 7 / 9 / 5 |
| Duplicated Lines | 1,4% |
| Security Hotspots Reviewed | 100% según measures; búsquedas de hotspots devuelven cero registros |
| Coverage | Sin valor en la respuesta de métricas |
| Quality Gate | OK, con condiciones sobre código nuevo de ratings y hotspots; sin condición de cobertura o duplicación en la respuesta |

Ese Gate no demuestra ratings globales A ni cobertura del 90%. No se enviaron análisis nuevos ni se cambiaron estados, resoluciones o revisiones en Sonar.

## Siete incidencias de seguridad

| ID Sonar | Ubicación/regla | Análisis y tratamiento local |
| --- | --- | --- |
| AaGMNrnBjhn-gbqnVrLV | cliente-navegador.mjs / S4036 | Chrome ya tenía ruta absoluta; se explicitan ruta Windows nativa, `shell:false` y PATH fijo de System32 para limitar la resolución de ejecutables. No se confirmó explotación previa. |
| AaGMNrmzjhn-gbqnVrLU | prestador-navegador.mjs / S4036 | Mismo tratamiento. Solo loopback, perfil temporal y backend productivo bloqueado. |
| AaGMNrnejhn-gbqnVrLa | api-simulada.mjs / S2068 | Cuenta CLIENTE sintética, no credencial productiva. Se reemplaza el literal compartido por 32 bytes aleatorios criptográficos por proceso. |
| AaGMNrnejhn-gbqnVrLb | api-simulada.mjs / S2068 | Igual para PRESTADOR. |
| AaGMNrnejhn-gbqnVrLc | api-simulada.mjs / S2068 | Igual para ADMINISTRADOR. Las demos y el runner usan la cuenta del mismo proceso. |
| AaGMNrnPjhn-gbqnVrLW | navegador.mjs / S2068 | El registro simulado usa una clave criptográfica efímera, conservada solo en memoria durante el recorrido. |
| AaGMJEaqDEK6ClmUiW-T | frontend-tests.yml / S6505 | Riesgo real de cadena de suministro por lifecycle scripts de dependencias: `npm ci --ignore-scripts`. Instalación limpia, tests y build verificados así. |

Son vulnerabilidades clasificadas por el analizador, no siete explotaciones productivas demostradas. Las claves antiguas eran fixtures y sus JWT tenían firma deliberadamente inválida en producción. No se cerraron como seguras ni se suprimieron reglas. La resolución remota exige otro análisis.

## Fiabilidad y mantenimiento

- Cinco S9383: cargas iniciales en DirectorioPrestadores, OficiosPrestador, PanelPrestador y SolicitudesCliente/Prestador ahora usan `void` explícito; sus funciones ya capturan errores y actualizan estados de UI. No se agregaron catches vacíos para esconder fallos.
- Tres S1244: coordenadas del runner se comparan con tolerancia `1e-8`, conservando la comprobación de redondeo público.
- Un S5850: agrupación explícita de alternativas en la comprobación de archivos privados del build.
- Cinco S8786: normalización de origen con `URL.origin`, listas CORS con `split(',').map(trim)` y validación de correo compartida lineal, acotada a 254 caracteres, en login/perfil heredado.

Además se rechaza HTTP hacia API no loopback antes de enviar tokens o formularios; se mantiene HTTP para demos locales y HTTPS para producción. El origen no admite rutas, credenciales, query ni fragmento. Se rechazan expiraciones de JWT desbordadas o no numéricas. React escapa texto externo y los popups usan DOM/textContent, sin HTML remoto. Tokens siguen en sessionStorage, nunca en variables de build; el riesgo ante XSS permanece y la autorización/firma siguen a cargo del backend. No se cambiaron endpoints, DTO ni permisos.

## Dependencias

El audit del lockfile inicial devolvió **3 paquetes altos**: Vite 8.3.2, undici 8.11.2 (jsdom), zod 4.6.5 (eslint-plugin-react-hooks). No existe en el checkout un informe que permita reconstruir los **18 riesgos** históricos; el número de advisories no equivale al número de paquetes afectados.

Se actualizaron dentro de los rangos compatibles a **Vite 8.3.5, undici 8.12.3 y zod 4.6.7**; no se cambió ningún major. Se agregó `@vitest/coverage-v8@5.0.3`, igual a Vitest. npm 10 falló internamente al actualizar (`edgesOut`); npm 11 temporal con Node 24 completó la actualización. `npm ci --ignore-scripts` reconstruyó el árbol desde el lockfile y el audit final reportó **0 vulnerabilidades**, incluidas desarrollo/producción. Esto describe el registro consultado, no garantiza ausencia de vulnerabilidades desconocidas.

## Cobertura real

`npm run test:coverage` ejecuta Vitest/V8 con un worker y genera `coverage/lcov.info`, `coverage/coverage-summary.json` y el detalle JSON. Se instrumentan todos los JS/JSX de `src` y todos los MJS de `scripts`; solo se separa `src/tests`, incluidos helpers, por ser código de pruebas. No hay exclusiones de fuentes, cobertura o duplicación en Sonar para elevar métricas.

| Alcance | Líneas | Statements | Branches | Functions |
| --- | --- | --- | --- | --- |
| Global src + scripts | 63,04% (1300/2062) | 54,25% | 69,46% | 71,64% |
| Aplicación src | 93,07% (1169/1256) | 91,21% | 84,33% | 93,22% |
| Herramientas scripts/qa | 16,25% (131/806) | 14,95% | 36,14% | 26,70% |

El objetivo **global >=90% no está alcanzado**. Las ejecuciones de Chrome y subprocesos no se incorporan automáticamente a la cobertura del proceso Vitest. Llegar de forma significativa requiere instrumentación/merge de cobertura E2E y pruebas aisladas de los servidores/runners, incluidas sus rutas de error. No se ejecutan runners de lectura productiva para obtener porcentaje ni se excluyen sus líneas. La cobertura que calcule Sonar puede diferir: también analiza CI/configuración y combina líneas/condiciones. No se sustituye por el porcentaje aislado de `src`.

53 pruebas nuevas cubren configuraciones inseguras antes del fetch, loopback, expiraciones extremas, carreras de 401, ausencia de cookies/redirects, correo de tamaño adversarial, texto externo sin ejecución de HTML, catálogo local manipulado, errores y accesos del cliente. Las suites existentes cubren permisos, moderación, solicitudes y formularios de los tres roles.

## Auditoría de LCOV y preparación para revisión

Se conservaron los **28 archivos locales** anteriores (23 modificados y 5 nuevos). En esta continuación solo se amplían el workflow y este informe; no se rehacen las correcciones. `git fetch origin` confirmó que HEAD y `origin/main` siguen en `595231f` (0 commits de diferencia); el trabajo de seguridad todavía no tiene commit.

### Denominador, inventario e integridad

Inventario independiente del disco: **66 archivos JS/JSX en src y 15 MJS en scripts = 81**. El LCOV tiene exactamente **81 registros SF únicos**, todos resolubles, sin archivos omitidos, extras o duplicados. Para cada archivo se comprobaron DA (líneas/hits), LF (líneas medibles), LH (líneas cubiertas) y rangos válidos respecto del archivo real. La suma coincide con `coverage-summary.json`; BRH/BRF también coinciden: **1308/1883 condiciones**. Se repitió la suite completa para regenerar el reporte, no se reutilizó un LCOV antiguo.

La diferencia no es un promedio simple ni un fallo del scanner:

```text
src:     1169 cubiertas / 1256 medibles = 93,07%;  87 sin cubrir
scripts:  131 cubiertas /  806 medibles = 16,25%; 675 sin cubrir
global: (1169 + 131) / (1256 + 806) = 1300/2062 = 63,04%
```

Los scripts aportan **675 de las 762 líneas globales sin cubrir (88,58%)**. Once entrypoints/runners tienen cero hits y suman 659 líneas; las otras 16 líneas QA sin cubrir pertenecen a ramas de `api-simulada.mjs`. Los datos de demos y `protocolo-cdp.mjs` sí se ejecutan desde las pruebas. Las 11 herramientas con cero hits son admin-demo, build-estatico, cliente-demo, cliente-navegador, cors-permisos-reales, demo-local, lecturas-reales, navegador-lecturas, navegador, prestador-demo y prestador-navegador.

Todo el código aplicativo relevante aparece: bootstrap `main.jsx` (0/1), App (13/21), rutas, pantallas, servicios, sesión, contexto, validaciones, componentes y datos. No se removieron bootstrap ni cargador dinámico de mapas por estar poco cubiertos. `solicitudesCliente.js` y `solicitudesPrestador.js` aparecen con LF=0 porque solo reexportan símbolos; no son archivos excluidos ni prueba de cobertura funcional del 100%. CSS, fuentes, HTML y SVG no tienen contadores V8 de JS, pero siguen en el alcance estático de Sonar.

`sonar.tests=src/tests` clasifica tests, setup y helpers como código de pruebas; su separación del denominador aplicativo es deliberada y no elimina código productivo. `vite.config.js` y `eslint.config.js` son infraestructura declarativa analizada por Sonar, pero no están en el LCOV src/scripts: se verifican ejecutando configuración, lint y build. No se añadieron exclusiones Sonar para ocultarlos; el scanner puede incorporarlos a sus líneas medibles sin hits. Por eso no se garantiza que el porcentaje global de Sonar coincida exactamente con el local. Además, `coverage` en Sonar combina líneas y condiciones y no equivale a `line_coverage`: ver [definiciones oficiales](https://docs.sonarsource.com/sonarqube-cloud/managing-your-projects/metric-definitions).

### Tratamiento de la infraestructura QA

Se mantienen todos los runners en el denominador. Ejecutarlos como subprocesos o mediante CDP valida comportamientos, pero no alimenta automáticamente el inspector V8 del worker Vitest. No se transforman resultados E2E aprobados en hits inventados. Para mejorar cobertura deben añadirse pruebas significativas de arranque, cierre, límites de payload/origin, errores HTTP/CDP y reintentos, instrumentando los procesos Node y la aplicación de navegador y fusionando sus mapas de cobertura con los unitarios, con deduplicación de líneas y sourcemaps. Los runners de lectura real necesitan fixtures/intercepción local para probarse sin depender de producción. No se ejecutaron contra producción para mejorar métricas.

No se aplicó un tratamiento selectivo que retire QA o infraestructura de Sonar. La medición de src es solo un desglose informativo; **el 90% global no está alcanzado** y tampoco se declara 90% de condiciones en src (84,33%).

### Publicación verificable desde GitHub Actions

El workflow genera cobertura antes del scanner, en el mismo job y workspace. Ahora verifica el inventario completo src/scripts, su inclusión en `sonar.sources`, la separación de tests, la ruta LCOV configurada, la unicidad y validez de las líneas y la concordancia LF/LH con el resumen. Un archivo faltante o un reporte incoherente bloquea el job. El paso se ejecutó localmente extrayendo exactamente el bloque del workflow y aprobó con 81 fuentes y 1300/2062 líneas.

El paso normaliza únicamente los separadores de SF de Windows a `/`; no cambia contadores ni porcentajes. El scanner recibe ese mismo `coverage/lcov.info` mediante `sonar.javascript.lcov.reportPaths`. `actions/upload-artifact` está fijado al SHA oficial `ea165f8d65b6e75b540449e92b4886f43607fa02` (v4) y conserva LCOV + resumen durante 14 días, como evidencia descargable por ejecución. Se intenta conservarla incluso si falla un paso; su existencia no equivale a un Gate aprobado. No se suben perfiles Chrome, capturas, variables, tokens ni el contenido de las sesiones.

Antes del scanner se comprueba solo si `SONAR_TOKEN` está vacío; en ese caso se falla con un mensaje de configuración. No se imprime su valor ni se pide por chat. No se ha podido confirmar remotamente si el secreto existe o si Automatic Analysis está activo. Configuración por la persona autorizada:

1. En Sonar generar un token con el permiso necesario de análisis del proyecto.
2. En el repositorio frontend: **Settings > Secrets and variables > Actions > New repository secret**, nombre `SONAR_TOKEN`. Ingresar el valor únicamente en GitHub, no en archivos, comandos compartidos o chat. Si es un secreto de organización, otorgar acceso a este repositorio.
3. En Sonar, **Administration > Analysis Method**, confirmar análisis desde CI y apagar Automatic Analysis si está activo. La [importación de LCOV requiere CI](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/test-coverage/javascript-typescript-test-coverage).
4. Tras aprobación de commit/push, ejecutar el workflow: descargar el artefacto de esa ejecución y comprobar en el log del scanner que cargó LCOV sin rutas no resueltas, en el proyecto/rama/commit correctos. Comparar `line_coverage`, `branch_coverage`, `coverage`, `lines_to_cover`, `uncovered_lines` y métricas de Overall Code frente a New Code. No confundir Gate sobre código nuevo con cobertura global.

Los permisos siguen siendo de lectura, sin credenciales persistentes del checkout, y el secreto está limitado a comprobación/scanner. No se usa `pull_request_target` para ejecutar código de terceros con secretos. El scanner se omite en PR de forks; estos necesitan análisis por un flujo autorizado. También falta verificar que el plan Sonar permita analizar esta rama/PR. YAML e integridad del reporte están validados localmente; la ejecución real de GitHub Actions y la publicación en Sonar siguen pendientes de aprobación y acceso.

Se consultó sin autenticación `api/settings/values` del proyecto, restringiendo las claves a sources/tests, inclusiones/exclusiones, exclusiones de cobertura/CPD y ruta LCOV. Respondió **HTTP 200, `settings: []`**: no devolvió overrides para esas claves. No se consultaron claves de secretos. Esto no reemplaza comprobar la configuración efectiva y el inventario en el log del próximo scanner.

### Revalidación de esta continuación

- **484/484 tests**, 56 archivos, un worker, Node 24.22.2; mismo resultado de cobertura: 63,04% global y 93,07% src.
- Lint, build y smoke del artefacto (**13 rutas SPA, 11 archivos, worker de mapa**) aprobados. Persiste solo el aviso conocido de tamaño del bundle MapLibre.
- `npm audit --json`: **0 vulnerabilidades** de todas las severidades en el árbol actual.
- Configuración YAML parseada y bloque real de verificación LCOV ejecutado correctamente. No hay nuevas exclusiones ni cambios al denominador.
- Recorrido Chrome repetido: **84 controles aprobados**, 206 llamadas y 22 escrituras simuladas, cero excepciones JavaScript; cubre landing/registro/login/directorio/mapa y CLIENTE, PRESTADOR y ADMINISTRADOR. La API productiva permanece interceptada. Los 49/62 controles específicos de las demos corresponden a la validación anterior, no se suman como tests nuevos.
- `git diff --check` correcto. Los 28 archivos originales siguen presentes, sin cambios CSS ni backend, sin stage/commit/push/PR/merge. Se detuvo el servidor local usado en esta continuación.

**Preparación:** listo para revisión, commit y posterior PR de seguridad hacia `main`, sujetos a aprobación del usuario. No está certificado para merge ni para afirmar cumplimiento de todas las metas: falta publicar el análisis CI, confirmar ratings/Gate del código corregido y completar cobertura global. No se cambió ningún estado remoto de Sonar.

## CI y pasos pendientes

El workflow ahora cubre PR hacia main/develop, push a main/develop y esta rama, y ejecución manual. Tests con cobertura, lint, build y audit corren secuencialmente; permisos `contents:read`, credenciales de checkout no persistentes y acciones fijadas a SHA oficiales. El scanner v8.3.0 se fijó al SHA `d209202bc7d53ff1cc128f7f907dac145c9d6ae9` y espera el Gate (`sonar.qualitygate.wait=true`). Los PR de forks no reciben token ni ejecutan el scanner; eso no certifica su Gate.

`sonar-project.properties` incluye aplicación, datos, estilos, assets, scripts y CI/configuración; `src/tests` se clasifica por separado, sin solapamiento ni exclusiones artificiales. LCOV se importa con `sonar.javascript.lcov.reportPaths=coverage/lcov.info` según la [documentación oficial](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/test-coverage/javascript-typescript-test-coverage). Se verificaron los paths y la existencia del LCOV. YAML parseado correctamente; ejecutar GitHub Actions/Sonar sigue pendiente.

Para validar remotamente, tras aprobar commit/push:

1. Configurar `SONAR_TOKEN` como secret de GitHub Actions, sin compartirlo en archivos/chat. Confirmar permisos y soporte del plan para ramas/PR.
2. Revisar en Sonar Administration > Analysis Method y desactivar Automatic Analysis si está activo: la cobertura requiere análisis desde CI. No se modificó esa opción remota.
3. Ejecutar el workflow y comprobar en el log todos los sources, importación LCOV, rama/commit y cero incidencias pendientes de las reglas tratadas.
4. Confirmar ratings globales A, duplicación <=3%, hotspots y Gate sobre el nuevo análisis. Para imponer todas las metas, revisar las condiciones globales del Gate, no solo código nuevo. No rebajar umbrales para obtener OK.
5. Completar la cobertura global con E2E instrumentado antes de afirmar >=90%. Los ratings, duplicación y revisión de hotspots de estas modificaciones no se pueden certificar localmente.

Validación local: 484/484 tests, 56 archivos, un worker; lint y build correctos; 84 verificaciones Chrome con API simulada, 207 llamadas y 22 escrituras exclusivamente en memoria, cero excepciones JavaScript. Persiste la advertencia conocida de tamaño de MapLibre. El primer Chrome dentro del sandbox falló por timeout CDP; el recorrido completo fuera del sandbox aprobó. No hubo escrituras contra producción.

También aprobaron los runners modificados CLIENTE (49 controles) y PRESTADOR (62 controles), ambos con cero conexiones al backend publicado y sin excepciones. Smoke del artefacto compilado: 13 rutas SPA, 11 archivos, worker y comprobación de patrones privados aprobados. Se detuvieron los servidores y navegadores usados. El estilo remoto de OpenFreeMap emitió advertencias sobre filtros con valores nulos; no son excepciones de la aplicación.

## Archivos modificados

- CI/configuración: `.github/workflows/frontend-tests.yml`, `.gitignore`, `eslint.config.js`, `vite.config.js`, `sonar-project.properties`.
- Dependencias/comandos: `package.json`, `package-lock.json` (incluye transitivas requeridas por Vite: rolldown/bindings, tipos OXC y PostCSS).
- Seguridad/validaciones: `src/services/apiClient.js`, `src/services/sesionToken.js`, `src/utils/email.js`, `src/utils/perfilPrestador.js`, `src/pages/Login.jsx`.
- Promesas de carga: `src/components/DirectorioPrestadores.jsx`, `src/pages/OficiosPrestador.jsx`, `src/pages/PanelPrestador.jsx`, `src/pages/SolicitudesCliente.jsx`, `src/pages/SolicitudesPrestador.jsx`.
- Herramientas QA: `scripts/qa/api-simulada.mjs`, `scripts/qa/build-estatico.mjs`, `scripts/qa/cliente-navegador.mjs`, `scripts/qa/cors-permisos-reales.mjs`, `scripts/qa/navegador.mjs`, `scripts/qa/prestador-navegador.mjs`.
- Pruebas nuevas: `src/tests/SeguridadHttpSesion.test.js`, `src/tests/SeguridadValidaciones.test.jsx`.
- Documentación: `README.md`, `docs/registro-de-defectos.md`, este informe.

Total: 28 archivos (23 modificados y 5 nuevos), sin cambios CSS/diseños, sin stage, commit, push, PR ni merge. Las exclusiones de `.gitignore`/ESLint son únicamente artefactos generados (`coverage` y `.scannerwork`), no fuentes.

## Corrección de Actions #28/#29 y PR #31

### Estado consultado y causas exactas

La entrega anterior se publicó como `79cb898f2ca02903c4678a250c56d191dc1e9cd8`. Se confirmó por GitHub que el [PR #31](https://github.com/orianalinaferrari/servimap-frontend/pull/31) está abierto, no es draft, sale de `feature/sonarqube-seguridad-servimap` hacia `main`, es combinable y tiene checks fallidos (`unstable`). La rama local estaba limpia y sincronizada en ese commit al comenzar. No se modificaron otras ramas.

**[#28, evento push](https://github.com/orianalinaferrari/servimap-frontend/actions/runs/41041053782):** job `124013663005`, falló en «Comprobar configuración del secreto Sonar». El log muestra el mensaje de configuración y el scanner fue omitido. Tests, validación LCOV, lint, build y audit habían aprobado. Causa: `SONAR_TOKEN` vacío en esa ejecución, no un problema de cobertura o permisos del scanner.

**[#29, pull_request, intento 2](https://github.com/orianalinaferrari/servimap-frontend/actions/runs/41045521060/attempts/2):** job `124035847149`, la comprobación del secreto aprobó. El scanner detectó PR 31 hacia main, importó `coverage/lcov.info`, subió el reporte y esperó el procesamiento. Falló después con `QUALITY GATE STATUS: FAILED`. Esto demuestra que el secreto configurado sirve para autenticar/subir el análisis. No se regeneró ni se imprimió. La causa original de #28 está subsanada en cuanto a configuración, pero **no se reejecutó ni se certifica verde el evento push**.

No se amplían permisos: `contents: read` fue suficiente para checkout/análisis y el secreto se pasa mediante `env` únicamente a comprobación/scanner. La decoración del PR se realiza desde la integración Sonar, no exige otorgar escritura al GITHUB_TOKEN de este job. Se mantiene el guard para forks y no se usa `pull_request_target`. Automatic Analysis permanece desactivado; no se cambió esa opción ni ningún estado remoto de Sonar.

Se consultaron las API públicas con `pullRequest=31`: `qualitygates/project_status`, `measures/component`, `measures/component_tree`, `issues/search` y `sources/lines`. Son los resultados del código publicado, no predicciones locales:

| Condición del Gate sobre código nuevo | Valor real PR #31 | Umbral | Resultado |
| --- | --- | --- | --- |
| Reliability Rating | C (3) | A (1) | FAILED |
| Security Rating | A (1) | A (1) | OK |
| Maintainability Rating | A (1) | A (1) | OK |
| Coverage | 74,5% (74,545454...) | >=80% | FAILED |
| Duplicated Lines Density | 0,749063...% (Gate: 0,7%) | <=3% | OK |
| Security Hotspots Reviewed | 100% | 100% | OK |

El informe tiene **30 líneas nuevas, 12 sin cubrir; 25 condiciones, 2 sin cubrir**. Línea nueva: 60%; condiciones nuevas: 92%; cobertura combinada: `(18 + 23)/(30 + 25) = 74,545454...%`. El error #29 no fue falta de token, fallo de subida ni pérdida de LCOV. El Gate publicado exige 80%, mientras que el objetivo del equipo sigue siendo >=90% donde corresponda; no se rebajó ningún umbral.

`issues/search` devolvió exactamente **una incidencia abierta del PR**, bug MAJOR `AaGMkFHbbGMtFS3dR5Ye`, regla `javascript:S9383`, `src/pages/Login.jsx:72`: promesa de `navigate('/')` sin esperar/manejar explícitamente. No devolvió vulnerabilidades abiertas del PR. Esto no debe extrapolarse al rating de la rama main ni a vulnerabilidades desconocidas.

La anotación exacta de líneas nuevas sin hits fue:

| Archivo | Líneas de la revisión `79cb898` |
| --- | --- |
| scripts/qa/navegador.mjs | 2, 181, 185, 188, 204, 238, 257; dos condiciones pendientes en 238 |
| scripts/qa/build-estatico.mjs | 12 |
| scripts/qa/cors-permisos-reales.mjs | 28, 30 |
| scripts/qa/cliente-navegador.mjs | 4 |
| scripts/qa/prestador-navegador.mjs | 4 |

El log también contiene un warning al leer la fuente binaria InterVariable.woff2 como UTF-8. No es la condición fallida ni un error de importación LCOV; no se cambió la fuente ni se excluyó código para esconderlo.

### Correcciones locales dirigidas

- `Login.jsx`: `await navigate('/')` dentro del try/catch existente. Se conserva la ruta de destino y el diseño. Dos pruebas verifican que el submit siga bloqueado mientras navega y que un rechazo se muestre como error en vez de quedar como promesa sin manejar.
- `RunnerCorsAislado.test.js`: ejecuta el runner real con fetch completamente simulado; verifica 26 GET/OPTIONS, espacios en cabeceras y rechazo de CORS permisivo. No hay peticiones reales ni escrituras productivas.
- `src/tests/qa-cobertura.mjs`: harness de integración que levanta un Vite exclusivo, ejecuta el recorrido completo de 84 controles (API interceptada) y el smoke del build. Los procesos Node generan contadores nativos mediante `NODE_V8_COVERAGE` en una carpeta nueva bajo coverage; el servidor se detiene incluso si falla el recorrido. Se fuerza el escenario completo, sin heredar `SERVIMAP_QA_SCOPE=landing`.
- `src/tests/helpers/fusionarCobertura.mjs`: convierte los contadores con el mismo `ast-v8-to-istanbul` usado por Vitest y fusiona con el mapa unitario. Acepta solo archivos del inventario original y comprueba que no cambien los denominadores de líneas, statements, funciones ni branches. Los mapas se serializan del mismo modo que el JSON unitario para no duplicar ramas con columnas abiertas Infinity/null. Una fusión inicialmente rechazada por ese guard detectó este caso; se corrigió y tres pruebas con procesos reales verifican ramas parciales/completas y ausencia de duplicaciones.
- `vite.config.js`: guarda el mapa unitario en `coverage-unit.json`; el fusionado queda en `coverage-final.json`, LCOV y resumen. Se conserva la evidencia unitaria sin confundirla con la fusión ni acumular reportes viejos.
- `package.json`/lock: comando `test:coverage:qa` y dependencias directas de las herramientas ya presentes: ast-v8-to-istanbul 1.0.7 y librerías Istanbul de Vitest 1.0.2. No se cambia ninguna versión de runtime ni de esas herramientas.
- Workflow: unitarios con un worker -> lint -> build -> QA instrumentado/fusión -> integridad LCOV -> artefacto -> audit -> secreto/scanner/Gate. Se mantienen token, guard de forks, acciones fijadas y permisos. No se añade código productivo a exclusiones. ESLint aplica globals Node a los nuevos helpers MJS de pruebas.

Los nuevos harness/fixtures están en `src/tests` porque son pruebas e infraestructura de instrumentación; no se movió allí ningún archivo productivo o runner existente. Los 81 archivos src/scripts continúan analizados e instrumentados. Las fuentes, los thresholds y las reglas de Sonar no se modificaron. La instrumentación se basa en [contadores V8 y conversión AST](https://vitest.dev/guide/coverage), no en asignar hits por un resultado de test aprobado. El runner Ubuntu utilizado por CI [incluye Chrome](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md); no se descarga un navegador ni se desactiva su sandbox.

### Validación final local y límites de aceptación

Secuencia final con Node 24.22.2: `npm run test:coverage` (**491/491**, 59 archivos, un worker), lint y build aprobados, `npm run test:coverage:qa` aprobado de punta a punta. El recorrido final tuvo **84 controles**, 211 llamadas y 22 escrituras simuladas en memoria, cero excepciones JavaScript; el smoke comprobó **13 rutas y 11 assets**. Se verificaron los flujos públicos y los tres roles, sin escrituras productivas y sin cambios de diseño/CSS. Servidores y navegador cerrados. Persisten las advertencias conocidas del estilo remoto OpenFreeMap y tamaño de MapLibre.

`npm audit --json` final: **0 vulnerabilidades**, sin cambios de versión en las herramientas declaradas como dependencias directas. YAML parseado y el bloque exacto de integridad LCOV del workflow ejecutado sobre el reporte fusionado: **81 fuentes**, sin faltantes/duplicados, contadores consistentes. `git diff --check` aprobado, incluidos los nuevos archivos revisados por whitespace. No se almacenaron credenciales ni se subieron datos a Sonar desde esta notebook.

| Medición local | Líneas | Condiciones/branches | Statements | Funciones |
| --- | --- | --- | --- | --- |
| Unitarios actuales | 1328/2062 = 64,40% | 1315/1883 = 69,83% | 1610/2912 = 55,28% | 425/589 = 72,15% |
| Unitarios + QA real | 1590/2062 = 77,10% | 1428/1883 = 75,83% | 2045/2912 = 70,22% | 469/589 = 79,62% |
| src, sin cambiar alcance | 1169/1256 = 93,07% | 1098/1302 = 84,33% | 1369/1501 = 91,21% | 371/398 = 93,22% |
| scripts/qa, fusionado | 421/806 = 52,23% | 330/581 = 56,80% | — | — |

Cada denominador se comprueba por archivo antes/después de fusionar, no solo en el total. La configuración no retira código para lograr un porcentaje. El mapa unitario queda en `coverage-unit.json` y su resumen en `coverage-unit-summary.json`; el mapa combinado en `coverage-final.json` y sus LCOV/resumen son los que recibe Sonar. Los archivos nativos V8 son locales e ignorados por Git; el artefacto de CI conserva únicamente LCOV + resumen, sin sesiones ni tokens.

El contraste del LCOV local con las anotaciones exactas de `79cb898` muestra hits reales en las 7 líneas de navegador, la línea 12 del smoke y las líneas 28/30 de CORS; las dos condiciones de navegador:238 también se ejecutaron. Sobre **esa huella anterior** quedarían 28/30 líneas y 25/25 condiciones cubiertas: **53/55 = 96,36% combinado**. Es una comprobación local sobre líneas ya identificadas, **no un valor publicado ni garantía del siguiente análisis**: Sonar recalculará el código nuevo al incorporar `await navigate` y las demás modificaciones. Las dos líneas de arranque de cliente/prestador siguen sin hits en el LCOV; no se excluyen. La meta global >=90% sigue sin alcanzarse.

**Estado Git:** cambios nuevos solo en `feature/sonarqube-seguridad-servimap`, HEAD publicado sigue en `79cb898`; sin stage, nuevo commit, push, merge ni otro PR. Se conservan todas las correcciones anteriores. Archivos actuales: workflow, README, este informe, eslint.config.js, package.json/lock, Login.jsx, vite.config.js; nuevos tests FusionCobertura, NavegacionLoginAsync, RunnerCorsAislado y los dos harness/helpers MJS bajo src/tests.

**Listo para revisión y, con aprobación, commit/push a la rama del PR #31.** No está certificado en verde remoto. Tras publicar hay que comprobar ejecuciones push/pull_request y su importación LCOV fusionada, ausencia de S9383, ratings A, hotspots 100%, duplicación <=3% y Gate aprobado. No se reejecutan ni cambian desde aquí workflows del commit antiguo para presentar un resultado verde artificial; no se regeneran secretos, no se reactiva Automatic Analysis y no se alteran condiciones del Gate.

## Corrección del falso timeout de arranque en CI

Los logs del commit `b68418b` muestran el timeout en **Actions #30 push** (`41051299914`, job `124047738471`) y **#31 pull_request** (`41051306468`, job `124047759947`), ambos antes de llegar a Sonar. Son ejecuciones posteriores a los fallos históricos #28/#29 descritos arriba.

**Causa reproducida:** `qa-cobertura.mjs` esperaba que un chunk stdout contuviera literalmente `http://localhost:5173`. Vite colorea el puerto cuando CI activa ANSI: `http://localhost:\u001b[1m5173\u001b[22m/`. Se reprodujo con `CI=true`, `FORCE_COLOR=1` y sin `NO_COLOR`: la búsqueda literal devolvió false y, simultáneamente, el servidor respondió **HTTP 200**. Por eso aumentar los 20 segundos no corregía la causa. El stdout del hijo no se reenviaba, ocultando que Vite ya estaba escuchando. El logger de Vite confirma el formato con bold alrededor del puerto.

**Corrección:** nuevo helper de pruebas `servidorQa.mjs`, basado en la [API oficial de Vite](https://vite.dev/guide/api-javascript.html): `createServer` + `await listen()`, IPv4 loopback, puerto 0 asignado por el sistema y lectura del puerto real desde `httpServer.address()`. Comprueba HTTP 200 antes de continuar, con un límite de petición de 10 s (no una espera fija). Devuelve errores reales de bind/HTTP; cierra el servidor ante fallo y el harness usa `await server.close()` en finally. No hay parsing de logs, dependencia de ANSI/chunks, sleeps de arranque ni procesos Vite huérfanos.

El smoke `build-estatico.mjs` tenía el mismo patrón con los logs de `vite preview`. Se reemplazó por `await preview()`, puerto libre y cierre esperado del servidor HTTP; conserva sus controles de rutas/assets/secretos. No se modifica el comando dev habitual ni ningún origen de producción.

Se añadieron cuatro regresiones con servidores reales: entorno CI/color, dos puertos libres simultáneos y cierre, puerto ocupado propagado sin esperar logs y rechazo HTTP 404 sin índice. No se excluyó código ni se cambiaron fuentes, reglas, umbrales, secretos, versiones de dependencias o diseños. La instrumentación nativa, la fusión de LCOV y sus guardas de inventario/denominadores se conservan. La meta >=90% sigue pendiente de medición de Cloud y no se sustituye por la simple disponibilidad de Vite.

En la primera ejecución completa con colores de CI apareció una segunda carrera real en Windows: `EBUSY` al leer DevToolsActivePort recién creado por Chrome. El servidor Vite ya estaba disponible. `esperarPuertoChrome` en `protocolo-cdp.mjs` ahora verifica puerto válido y endpoint de navegador completo, reintenta solo ENOENT/EBUSY dentro de un límite y propaga otros errores. Se eliminó el patrón comprobar-existencia/leer del runner general. Seis regresiones adicionales cubren lectura inmediata, ambos errores transitorios, escritura parcial/puertos inválidos, error permanente y timeout con causa. No se relajan verificaciones CDP ni aislamiento de la API.

**Validación antes de publicar:** 501/501 tests, 61 archivos, un worker; lint, build y audit (0 vulnerabilidades) correctos. Harness completo bajo `CI=true`, `FORCE_COLOR=1` y sin `NO_COLOR`: 84 controles de navegador aprobados, 213 llamadas y 22 escrituras simuladas, cero excepciones; smoke de 13 rutas/11 assets aprobado. La fusión conserva las 81 fuentes y sus denominadores unitario/E2E: líneas 1592/2064 = 77,13%, condiciones 1434/1887 = 75,99%, statements 2045/2908 = 70,32%, funciones 471/589 = 79,96%. La aplicación src conserva 93,07% de líneas. El denominador fuente cambió respecto de la revisión anterior porque se simplificó el smoke y se agregó la espera CDP, no por exclusiones. Se cerraron todos los servidores/navegadores usados. El verificador real del workflow y `git diff --check` se vuelven a comprobar antes del commit.

Se publica únicamente esta corrección en la rama del PR #31, con autoría original y sin coautores. Al preparar este registro todavía no hay resultado remoto de ese nuevo commit: debe comprobarse la nueva ejecución push/pull_request y el Gate; las aprobaciones locales no equivalen a CI verde ni a >=90% global.

**Comprobación posterior al primer push (`4c76fe1`):** Actions #32 push (`41053794068`) y #33 pull_request (`41053800637`) superaron el arranque de Vite y fallaron después en «Chrome no expuso un puerto CDP utilizable». Por tanto el timeout inicial de Vite ya no es la causa. El runner ocultaba stderr del navegador, impidiendo precisar por qué el proceso no exponía CDP. Se fija `SERVIMAP_QA_BROWSER=/usr/bin/google-chrome` en el job Ubuntu para usar el Chrome instalado en la imagen, en lugar de depender del orden de descubrimiento de Chromium/Chrome. Se captura una cola acotada de stderr y se propagan errores de spawn/salida temprana con diagnóstico; no se agregan flags que deshabiliten el sandbox ni se silencian fallos. Esta segunda corrección se vuelve a validar localmente antes de publicar y requiere confirmar su resultado en la siguiente ejecución remota.

Revalidación de este segundo ajuste: 501 tests con un worker, lint y build aprobados; YAML válido, diff-check correcto. Harness con colores de CI: 84 controles, 13 rutas, 11 assets y fusión aprobados; 214 llamadas y 22 escrituras únicamente simuladas. Cobertura final: 1597/2071 líneas = 77,11%, 1436/1893 branches = 75,85%, 2049/2917 statements = 70,24%, 472/591 funciones = 79,86%. Se conservan las 81 fuentes. No se cambió el lockfile ni las dependencias del audit con cero vulnerabilidades.

**Siguiente verificación remota (`55bb3c1`, #34/#35):** Chrome ya inicia y se completan 17 controles públicos; el fallo pasa a «No se cumplió: QA PRESTADOR», con cero llamadas a la API. La configuración del servidor dev dependía de `.env.local` presente en la notebook e ignorado por Git; Vite en modo development no toma `.env.production`. Se corrige el harness con `envDir:false` y `define` explícito de VITE_API_URL al mismo `API_SIMULADA_ORIGIN` que intercepta el runner. No se modifica ningún archivo de entorno ni valor productivo. Una quinta prueba real del helper demuestra que la transformación usa el origen simulado aun con un .env.local distinto en un sitio temporal. Los cinco casos del helper aprobaron; se conservan las 501 pruebas completas anteriores porque el cambio solo afecta infraestructura de pruebas, y se repite el harness completo sin VITE_API_URL heredada y con colores de CI antes de publicar.

**Resultado remoto confirmado en `064978e`:** la ejecución pull_request #37 (`41055261252`, job `124061068101`) terminó **success**. La API de Sonar del PR #31 devolvió Gate **OK**, ratings nuevos A/A/A, cobertura nueva **94,1%**, duplicación nueva **0,3%** y hotspots revisados **100%**. Es el primer resultado verde remoto comprobado de esta secuencia, no una inferencia desde tests locales.

La ejecución push #36 (`41055253437`) falló de forma independiente al esperar «Agregar oficio». `llenar` esperaba solo que existiera el select, que se renderiza deshabilitado y sin opciones durante la carga; asignar el ID antes de recibir el catálogo pierde la selección. Se reemplaza por una condición de disponibilidad que exige control habilitado y opción presente/habilitada antes de despachar eventos. Cuatro pruebas DOM reproducen ausencia, disabled, catálogo pendiente y opción deshabilitada. No se cambia el formulario aplicativo.

Ese runner también registró ausencia de WebGL. CI selecciona ahora el driver GLES por CPU con `--use-gl=angle --use-angle=swiftshader`, modalidad SwANGLE documentada para bots sin GPU por [Chromium](https://chromium.googlesource.com/chromium/src/+/main/docs/gpu/swiftshader.md). No se usa `--enable-unsafe-swiftshader`, `--no-sandbox` ni se omite ningún control del mapa. El modo local por defecto no cambia; `SERVIMAP_QA_SOFTWARE_GL=1` lo activa solo en QA. Dos pruebas fijan exactamente los flags permitidos y el modo por defecto vacío. Esta estabilización exige repetir la ejecución remota del commit siguiente antes de certificar ambos eventos.

Revalidación final de la estabilización: **508/508 tests**, 62 archivos, un worker; lint y build correctos. Harness con CI, color, sin VITE_API_URL heredada y con SwANGLE: **84 controles**, 211 llamadas y 22 escrituras simuladas; smoke **13 rutas/11 assets**, cierre y fusión aprobados. LCOV: **1602/2075 líneas = 77,20%**, 1446/1901 branches = 76,06%, 2055/2921 statements = 70,35%, 475/594 funciones = 79,96%; 81 fuentes conservadas. Las cifras globales no se presentan como >=90%. No se actualizaron dependencias respecto del audit de cero vulnerabilidades.

## Perfiles, avatar y métricas posteriores a `8a452ec`

**Remoto verificado:** Actions #40 push y #41 pull_request del commit `8a452ec` terminaron **success**. La API de SonarCloud para el PR #31 devolvió Gate **OK**, cobertura global **77,9%** (líneas 79,3%, condiciones 76,1%), cobertura nueva **95,5%**, **0 issues abiertos**, ratings Security/Reliability/Maintainability **A**, duplicación global **2,0%** y nueva **0,26%**. El dashboard de `main` todavía muestra el análisis previo al PR (21 issues, Security y Reliability **C**, duplicación 1,4%, sin cobertura cargada); recién cambiará al integrar el PR y analizar `main`.

**Cambios locales (sin commit):** perfil de solo lectura del cliente (`/cliente/perfil`, datos de `GET /api/auth/me`, DNI no editable), completar perfil del prestador tras el login según `GET /api/prestadores/me`, reutilizando el formulario y `PUT /api/prestadores/me`, y avatar con iniciales en el header. No existe endpoint para editar datos del cliente o del usuario; queda documentado como dependencia del backend y no se simulan guardados.

**Validación local:** 553/553 tests en 65 archivos con un worker; lint, build, `git diff --check` y `npm audit` (0 vulnerabilidades) correctos. Harness QA completo: **84 controles**, 218 llamadas y 22 escrituras simuladas, cero errores JavaScript; smoke 15 rutas/11 assets.

**Cobertura fusionada local (V8/LCOV, mismo criterio que CI):** líneas 1677/2131 = **78,69%**, branches 1539/1968 = 78,20%; líneas + ramas **78,46%** (antes 77,34%, 929 → 883 elementos sin cubrir). Desglose: `src` **90,94%** (243 pendientes) y `scripts` **54,87%** (640 pendientes).

**Por qué no se alcanza >90% global ni 0% de duplicación en esta intervención:** los mayores pendientes son runners QA manuales que CI no ejecuta: `navegador-lecturas.mjs` y `lecturas-reales.mjs` (lecturas contra el backend publicado), `cliente-navegador.mjs` y `prestador-navegador.mjs` (Chrome con ruta fija de Windows, contra demos locales) y `admin-demo.mjs`/`demo-local.mjs`. Los dos runners de demo también concentran la duplicación global (~75 líneas compartidas). No se excluyeron del análisis ni se inventaron hits.

**Trabajo pendiente propuesto:** extraer el cliente CDP compartido de los runners de demo (elimina la duplicación), hacerlos multiplataforma y ejecutarlos en `qa-cobertura.mjs` contra sus demos con API simulada; ejecutar las lecturas reales contra fixtures locales, y seguir sumando pruebas en `SolicitudesPrestador`, `SolicitudesCliente` y `PanelPrestador`. Cada paso debe medirse en CI antes de declarar las metas.

## Duplicación y runners de demo integrados a la cobertura (posterior a `576426e`)

**Remoto antes de este cambio (PR #31, `576426e`):** Gate OK, cobertura global 79,7% (457 líneas y 427 condiciones sin cubrir), duplicación global 1,9% (163 líneas), 0 issues abiertos. `main` sigue mostrando el análisis previo al PR (21 issues, duplicación 1,4%).

**Duplicaciones confirmadas en SonarCloud y corrección:**
- `cliente-navegador.mjs` ↔ `prestador-navegador.mjs` (~75 líneas): el cliente CDP, helpers, verificaciones finales y limpieza pasan a `runner-demo.mjs`; cada runner conserva solo su recorrido y sus controles.
- `admin-demo.mjs` ↔ `demo-local.mjs` (26 líneas): la demo administrativa usa `iniciarDemo` con su aviso y sin CSP, como antes; sus datos pasan a `admin-datos.mjs`.
- `SolicitudesCliente.jsx` ↔ `SolicitudesPrestador.jsx` (18 líneas): campos comunes del detalle en `CamposDetalleSolicitud.jsx`; cada vista mantiene su propio formato de valores.
- El arranque de Chrome/Edge de `navegador.mjs` y de los runners se comparte en `chrome-cdp.mjs` (timeout de 30 s, diagnóstico de stderr y pestaña inicial lista).

**Integración en CI:** `qa-cobertura.mjs` ejecuta, tras el recorrido general y el smoke del build, `cliente-navegador.mjs` y `prestador-navegador.mjs` contra sus demos con API simulada (puertos loopback fijos), espera disponibilidad HTTP y detiene cada demo con SIGTERM para volcar su cobertura. Sin escrituras ni conexiones a producción: los runners siguen bloqueando el backend publicado.

**Validación local (Windows, Node 22.19.0):** 569/569 tests en 66 archivos con un worker; lint, build y `git diff --check` correctos. Harness QA completo en 72 s: recorrido general 84 controles, runner cliente 49 y prestador 62, todos aprobados; fusión de 4 ejecuciones V8 y 90 fuentes; el control de integridad LCOV del workflow pasa. En Windows el SIGTERM es forzado, así que la cobertura propia de los procesos de demo solo se vuelca en Linux (CI).

**Cobertura local fusionada:** líneas 1917/2136 = **89,74%**, branches 1613/1939 = 83,18%; líneas + ramas **86,63%** (antes 77,34%; pendientes 929 → 545). `src` 90,94%; `scripts` 78,32%.

**Pendiente para >90% global:** `navegador-lecturas.mjs` (145) y `lecturas-reales.mjs` (40) validan a propósito la API publicada y no se ejecutan en CI para no depender de producción; requieren decidir si se agrega un modo fixture explícito. Restan además `api-simulada.mjs` (32), `navegador.mjs` (30) y las vistas `SolicitudesPrestador`, `SolicitudesCliente` y `PanelPrestador` (~70). Las métricas remotas (cobertura, duplicación 0% e issues) deben confirmarse en SonarCloud tras publicar.

### Lecturas en modo fixture local e integración final

Autorizado explícitamente: `lecturas-reales.mjs` y `navegador-lecturas.mjs` incorporan un modo local **solo QA**, activado con `SERVIMAP_QA_LECTURAS_API` y limitado a orígenes http de loopback; sin la variable conservan el modo real. `lecturas-reales.mjs` expone `verificarLecturas` con las mismas aserciones (estado, CORS, datos privados, coordenadas redondeadas, rutas protegidas, ficha). La fixture usa el servidor de demos extraído como `crearServidorApiQa` sobre la API simulada, que ahora responde `/health` como el contrato publicado. `navegador-lecturas.mjs` usa el arranque compartido de `chrome-cdp.mjs`.

`LecturasQa.test.js` ejercita la verificación real contra la fixture HTTP: caso válido y rechazos por dato privado expuesto, ruta protegida sin 401, coordenadas sin redondear, catálogo con tipos incorrectos, salud degradada y origen no autorizado, además de la selección de modo. El harness ejecuta ambos scripts en modo local después de las demos, con un solo navegador a la vez.

Se corrigió una carrera previa del runner cliente: tras `Page.reload` podía validar el documento anterior. Ahora espera la recarga efectiva y la tarjeta concreta; `until` solo reintenta el error de contexto destruido por navegación.

**Validación local:** 578/578 tests en 67 archivos con un worker; lint, build y `git diff --check` correctos. Harness en 87 s: general 84 controles, cliente y prestador aprobados, lecturas locales aprobadas (navegador 65 controles); 6 ejecuciones V8 y 90 fuentes fusionadas; control LCOV del workflow correcto.

**Cobertura local fusionada:** líneas 2034/2146 = **94,78%**, branches 1690/1960 = 86,22%; líneas + ramas **90,70%** (382 elementos pendientes; `src` 90,94%, `scripts` 90,24%). Margen estrecho: debe confirmarse en SonarCloud tras publicar, igual que duplicación 0% e issues 0.

### Pruebas de contratos de error y flujos alternativos

`ApiSimuladaContratos.test.js` verifica las respuestas de error de la API simulada que usan demos y QA (401 por token inválido o vencido, 400/403/404/409 en registro, perfil, solicitudes, transiciones, calificaciones, moderación y oficios). `SolicitudesVariantes.test.jsx` cubre formatos alternativos de cliente/prestador/servicio y la recarga fallida tras una acción confirmada por el servidor.

**Validación local:** 607/607 tests en 69 archivos con un worker; QA completo en 81 s con los cinco recorridos aprobados y control LCOV correcto; lint y build correctos. **Cobertura fusionada:** líneas 95,39%, ramas 88,16%, líneas + ramas **91,94%** (331 pendientes; `src` 91,98%, `scripts` 91,85%).

**Por qué no se continúa hacia 97–99%:** los pendientes restantes son, en su mayoría, guardas defensivas (`if (activo)` tras desmontar, rechazos que no son `Error`, bloqueos por doble clic), ramas de fallo de los runners QA (Chrome/CDP caído, timeouts, capturas de error) y código heredado sin uso productivo (`adminOficios.js`, `oficiosPrestador.js`, `construirParametrosFiltros`, ~28 elementos). Cubrirlos exigiría inyectar fallos artificiales o probar código muerto; eliminar ese código es una decisión pendiente, no una exclusión.
