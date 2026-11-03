# Arranque de Chrome/CDP en el PR #39

## Evidencia y alcance del diagnóstico

- Fallo revisado: [Actions 41668229832](https://github.com/orianalinaferrari/servimap-frontend/actions/runs/41668229832),
  job `126029241829`, commit `9158af1`, 03/11/2026.
- Node 24.22.1, imagen Ubuntu 26.04 `20261025.179.1`, Chrome seleccionado en
  `/usr/bin/google-chrome`, SwANGLE activado por el workflow.
- Las 793 pruebas, lint y build pasaron. QA falló en fase `inicio`, con cero
  verificaciones, llamadas y escrituras simuladas: la aplicación no se había
  cargado todavía en el navegador.
- A los 30 segundos, Chrome seguía sin un `DevToolsActivePort` válido. El
  stderr conservado solo contenía mensajes de conexión DBus. No se registró
  una salida fatal del proceso; el error fue el timeout del handshake.
- Dos ejecuciones de main pasaron con la **misma versión de Node e imagen**:
  [41656420385](https://github.com/orianalinaferrari/servimap-frontend/actions/runs/41656420385)
  y [41653803761](https://github.com/orianalinaferrari/servimap-frontend/actions/runs/41653803761).
  Los cambios de perfiles no modificaron el launcher, protocolo ni workflow.

El fallo comprobado es un arranque de Chrome que no completó el handshake en
el plazo existente, compatible con un incidente intermitente del entorno. No
hay evidencia para atribuirlo a Node 24 ni a los perfiles. **La causa interna de
la demora de Chrome no puede establecerse con el log original**, cuya cola de
stderr se limitaba a 2 KB. Los mensajes DBus no demuestran por sí solos una causa
fatal; no se suprimen ni se cambia su configuración para hacer pasar QA.

El descubrimiento de CDP usa puerto dinámico y un perfil exclusivo, como indica
la [documentación de Chrome](https://developer.chrome.com/docs/automation-and-testing/debug-headless).
No hay puerto fijo compartido ni perfil personal. El wrapper de cobertura hace
lo correcto al propagar el exit code del runner; no es la causa del fallo.

## Corrección de robustez

1. Cada intento usa un directorio nuevo generado con `mkdtempSync`; no se reutiliza
   el archivo de puerto de otro proceso ni un perfil del usuario.
2. Se conserva el plazo de 30 segundos, el sandbox y todos los argumentos de
   renderizado. No se agrega `--no-sandbox`, no se fija un puerto ni se desactiva QA.
3. Solo el timeout tipado del puerto, con Chrome aún vivo, admite un segundo
   intento. No se reintentan la aplicación, los tests ni la búsqueda de pestaña.
   Permisos, ejecutable ausente, salida fatal y demás errores siguen fallando.
4. Se comprueban también los eventos ocurridos en la última pausa del polling.
   Así, un error de lanzamiento `ENOENT` no se trata como si únicamente faltara
   el archivo temporal de CDP, y una salida fatal no dispara recuperación.
5. Antes del reintento se exige el cierre del proceso anterior: SIGTERM, SIGKILL
   si no cerró en 1 s y fallo definitivo si no se confirmó el cierre en 2 s.
   En Linux el proceso está en un grupo propio y se señala ese grupo; Windows
   conserva `windowsHide` y la terminación del proceso hijo. No se señalan
   procesos de otros navegadores ni se buscan procesos por nombre.
6. Cada intento fallido deja un JSON con ejecutable, argumentos, perfil, PID,
   Node/plataforma, duración, estado de salida, error/causa, fallo de cierre y
   los últimos 65.536 caracteres de stderr. El runner avisa incluso si se recupera.
   Si falla otra vez, el error conserva ambos intentos y el QA termina en fallo.
7. La consulta inicial `/json/list` tiene un timeout de red explícito para no
   quedar bloqueada fuera del plazo previsto. Debe devolver una pestaña CDP real.

## Cambio de CI

El harness pasa `SERVIMAP_QA_DIAGNOSTICOS=coverage` a sus procesos. El paso de
artefactos existente, que corre también ante errores, incluye ahora
`coverage/chrome-cdp/`. No se cambian imagen, Node, tiempos del workflow,
obligatoriedad de QA, inventario LCOV, umbrales ni exclusiones SonarCloud.
Los perfiles temporales no se suben como artefactos; solo los diagnósticos.

## Validación y límites

Se usa un runtime portátil oficial de Node 24.22.1 para Windows, con SHA256
contrastado con `SHASUMS256.txt` de nodejs.org. Está en una caché ignorada, sin
instalar Node en el sistema ni modificar package.json/lock/dependencias.
Chrome local es 156.0.8078.74. El QA real se ejecuta también con SwANGLE como CI.

No hay WSL instalado ni Docker disponible. No se reproduce exactamente el kernel,
sandbox ni DBus de Ubuntu. Las pruebas simulan los estados de proceso y verifican
el grupo Linux con señales interceptadas, además del recorrido real en Windows.
La efectividad ante el incidente específico de GitHub requiere una nueva ejecución
Linux tras publicar con autorización; no se declara resuelto remotamente.

Archivos: `scripts/qa/chrome-cdp.mjs`, `scripts/qa/protocolo-cdp.mjs`,
`src/tests/ChromeCdpArranque.test.js`, `src/tests/qa-cobertura.mjs`,
`.github/workflows/frontend-tests.yml` y este documento. No se modifican backend,
perfiles, navegación ni el PR #29. Cambios pendientes, sin commit ni push.

## Resultados locales finales

- 23 pruebas dirigidas del launcher/protocolo aprobadas; la recuperación se
  verifica mediante fallos inyectados y señales simuladas, sin matar procesos reales.
- `npm run test:coverage`: **805 pruebas en 79 archivos**, aprobadas con Node
  **24.22.1**. Lint, build y `git diff --check` correctos con esa versión.
- `npm run test:coverage:qa`, Node 24.22.1 y
  `SERVIMAP_QA_SOFTWARE_GL=1`: aprobado completo, con **106** controles
  principales, **40** de ayuda, **49** de cliente, **66** de prestador y **65**
  de lecturas. Verificación de build estático en **16** rutas SPA.
- La fusión V8 y el validador de integridad/inventario del workflow pasan:
  **98 fuentes**, **96,03 % de líneas y 89,94 % de ramas** globales locales.
  No se excluyeron archivos ni se alteraron los denominadores o umbrales.
- No se reprodujo el timeout real de Chrome en Windows con Node 24. No se
  considera esto una certificación del entorno Linux ni una aprobación remota.
  Sigue pendiente ejecutar el PR #39 con el parche una vez autorizado publicarlo.
