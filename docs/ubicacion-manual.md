# Ubicación de referencia manual — requerimiento 6

Rama `feature/ubicacion-manual`, creada desde `origin/main` actualizado, commit `a517caa622e380c10def94106628430486715b15`, tras verificar el merge del PR #34. Árbol inicialmente limpio. Sin commit, push ni PR durante la implementación.

## Auditoría y alcance

El mapa existente usa MapLibre y el estilo Liberty de OpenFreeMap, con créditos de OpenStreetMap. Ya tenía marcadores públicos, popups, navegación hacia la ficha y geolocalización solicitada mediante un botón. Se conservan esos recorridos y se reutilizan `obtenerCoordenadas`, los servicios de consulta y los controles de MapLibre.

No se encontró geocodificación en los componentes, servicios ni dependencias. La búsqueda existente por zona/nombre/oficio filtra prestadores; no convierte direcciones o localidades en coordenadas. OpenFreeMap se utiliza como cartografía, sin incorporar una operación nueva de geocodificación. Buscar una dirección requeriría seleccionar y autorizar un servicio adicional y revisar condiciones de uso, límites, privacidad y eventualmente API key. No se agrega uno ni se simulan resultados.

## Uso

- Mover y alejar el mapa permite elegir puntos fuera de la zona inicial, también en otros países. Un clic o toque coloca un marcador cuadrado claro, distinto de los prestadores y del punto de GPS.
- Otro clic o toque cambia la referencia; Limpiar ubicación de referencia la elimina y devuelve el foco al control de selección del centro.
- Con teclado se enfoca el canvas, se desplaza el mapa con flechas y se activa Usar centro del mapa como referencia. También hay un botón de recentrado.
- Usar mi ubicación sigue siendo opcional. Su rechazo, ausencia o error no impide elegir manualmente. Una respuesta de GPS tardía no reemplaza una selección manual más reciente ni restaura una referencia eliminada.
- Interactuar con marcadores, controles o popups no selecciona otro punto. Los filtros no arrastran la cámara a la zona inicial mientras existe una referencia elegida.

## Datos y límites

La referencia se mantiene en el estado React de `BuscadorPrestadores` como `{ latitud, longitud, origen: 'manual' | 'gps' }`, disponible para el requerimiento 7. `MapaPrestadores` expone `ubicacionReferencia` y `onCambiarUbicacionReferencia`, con estado local si se usa de forma independiente. No se calcula ninguna distancia ni se altera el filtrado o la consulta HTTP.

La selección sobrevive a cambios de filtros y a abrir/cerrar una ficha dentro del directorio. Se pierde al recargar o abandonar el directorio. No se guarda en localStorage, sessionStorage, perfil profesional ni backend. Se validan números finitos y latitud dentro de rango; se envuelve la longitud de las copias del mundo que permite MapLibre, conservando el mismo punto geográfico.

La selección requiere cartografía/WebGL para usar el mapa; si falla, se conserva el listado y el aviso existente. Se mantienen los límites de proyección y zoom de MapLibre: no se agrega una restricción geográfica a Argentina ni a la ubicación física del usuario.

## Validación

Las pruebas de `MapaPrestadoresUI.test.jsx` cubren selección fuera de Argentina, actualización/eliminación, GPS opcional/denegado/ausente/inválido/tardío, teclado mediante un control nativo, foco tras limpiar, filtros, ficha, popups, validación de coordenadas, copias del mundo y limpieza de listeners.

El runner existente `scripts/qa/navegador.mjs` incluye clic y toque reales con GPS denegado, convivencia con popups, selección del centro con teclado y responsive. Se ejecuta dentro del proceso existente de cobertura QA; no se agrega otro runner sin integrar su cobertura. Las APIs se simulan, sin escrituras al backend real; el mapa real usa MapLibre/OpenFreeMap.

Node disponible: `v26.13.0`; no se encontró Node 24 en PATH ni en las instalaciones habituales. No se cambia la configuración del proyecto ni se agregan dependencias.

Resultado final:

- `npm run test:coverage`: 719 tests aprobados en 74 archivos; se agregaron 20 casos al archivo de pruebas del mapa, que ahora contiene 39.
- `npm run test:coverage:qa`: aprobado. Recorrido principal de Chrome con 95 comprobaciones, incluidas selección manual, controles sin superposición, toque, teclado, GPS denegado y popups; además, 40 comprobaciones de FAQs, 49 del recorrido de cliente, 62 del prestador y 65 de lecturas públicas con fixture local.
- Se revisó visualmente la captura de referencia manual y se corrigió la posición de los controles en escritorio. Los clics sobre prestadores usan eventos reales de Chrome; después de centrar GPS se aleja el mapa para tener al prestador dentro del encuadre antes de pulsarlo.
- `npm run lint`, `npm run build` y `git diff --check`: aprobados. Build conserva el aviso existente de chunks grandes.
- Cobertura final fusionada: 95,65 % de líneas y 89,21 % de ramas del proyecto. Se conservan las reglas de SonarCloud y las exclusiones existentes. Las métricas remotas de código nuevo solo pueden verificarse después de publicar y analizar la rama.
