# Seguridad, SonarQube y cobertura — 30/10/2026

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
