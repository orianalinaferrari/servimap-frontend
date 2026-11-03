# Distancias aproximadas — requerimiento 7

Rama `feature/distancias-prestadores`, creada desde `main` actualizado en `deca7e03e170e4b5f8a5123547d4861995dcb5fd`, tras verificar el merge del PR #35 y el árbol limpio. Implementación local sin commit, push ni PR.

## Origen y datos públicos

Se reutiliza el estado temporal `ubicacionReferencia` de `BuscadorPrestadores`, incorporado en el PR #35: `{ latitud, longitud, origen }`, tanto para elección manual como GPS opcional. La referencia se conserva al filtrar y al abrir/cerrar fichas mientras permanece montado el directorio; no se almacena en el backend ni en almacenamiento persistente del navegador.

Destinos: únicamente coordenadas recibidas por las consultas públicas ya existentes:

- `GET /api/prestadores` para las tarjetas.
- `GET /api/prestadores/{id}` para la ficha remota.
- `GET /api/prestadores/mapa` para las posiciones y popups del mapa.

El 2 de noviembre de 2026 se consultaron el Swagger desplegado y una muestra del listado público, sin autenticación ni escrituras. El listado devuelve `latitud` y `longitud`; se confirmó en el código del backend que `formatearResumen` aproxima ambas a dos decimales y que la ficha pública reutiliza ese resumen. No se consultan coordenadas de `/api/prestadores/me` para calcular distancias.

Referencias de contrato: [Swagger público](https://servimap-backend.vercel.app/api-docs/), [resumen, ficha y búsqueda del backend](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/src/services/prestadoresService.js). El backend dispone de cálculo por radio al recibir origen, pero no se activa: no se envían latitud/longitud de referencia, radio ni un orden nuevo a la API. No hay una dependencia nueva del backend.

## Cálculo y presentación

`src/utils/distancias.js` calcula Haversine con radio terrestre medio de 6371 km, sin servicios externos. Valida latitud entre −90 y 90 y longitud entre −180 y 180. Rechaza nulos, ausentes, vacíos, espacios, booleanos, objetos y valores no finitos; admite números decimales serializados compatibles con la utilidad existente de coordenadas. Limita errores de redondeo de Haversine cerca de antípodas para evitar NaN.

Se muestra un decimal en kilómetros, con formato argentino, y el texto «Distancia aproximada: … km en línea recta (no por calles)». Es una estimación sobre posiciones públicas aproximadas, no un recorrido, tiempo de viaje ni domicilio exacto. Una cifra que redondea a 0,0 km no certifica coincidencia de domicilios.

Sin referencia válida, no se muestra texto de distancia. Con referencia válida y destino sin coordenadas públicas válidas, se muestra «Distancia no disponible». No se infiere una ubicación a partir del nombre o zona ni se reutiliza un campo `distanciaKm` preexistente del servidor.

`DistanciaPrestador` comparte la presentación entre tarjeta y ficha. Los popups utilizan el mismo formateador y actualizan el párrafo existente sin recrear marcadores ni cerrar la ventana por un cambio de referencia. La referencia se pasa a la ficha remota, que usa las coordenadas de su propia respuesta pública. Cambiar la referencia no dispara otra lectura de ficha.

Los filtros, consultas, orden de resultados, marcadores, solicitudes y permisos de roles se conservan. No se agregan filtros por radio, ordenamiento por cercanía, geocodificación, rutas ni dependencias.

## Verificación

Las pruebas cubren distancias conocidas, cero, hemisferios negativos, simetría, polos, antimeridiano, antípodas, validación, origen ausente, destino ausente y ausencia de mutaciones. Los recorridos de UI verifican cambios manuales/GPS, limpieza, mantenimiento del orden, filtros y búsqueda, fichas locales/remotas, popups abiertos y errores de API sin perder la referencia ni dejar una pantalla en blanco.

El runner existente `scripts/qa/navegador.mjs` verifica tarjetas, coincidencia de distancia con popups y ficha pública, limpieza, cambio manual/GPS, textos explícitos y responsive. Sigue integrado en `test:coverage:qa`; no se agrega un runner fuera del LCOV ni se cambia la configuración de SonarCloud, umbrales o exclusiones.

Node disponible: `v26.13.0`; no se encontró Node 24 en PATH ni en las instalaciones habituales. No se adapta la configuración del proyecto a otra versión.

### Resultados locales

- `npm run test:coverage`: 752 tests aprobados en 76 archivos, con 33 casos nuevos sobre distancias y su integración.
- `npm run test:coverage:qa`: aprobado. Chrome completó 106 comprobaciones principales, 40 de FAQs, 49 del recorrido de cliente, 62 del prestador y 65 de lecturas públicas con fixture. Las escrituras de negocio fueron simuladas; ninguna fue enviada al backend real.
- `npm run lint`, `npm run build` y `git diff --check`: aprobados. Se mantiene el aviso previo por chunks grandes.
- Se inspeccionaron capturas del directorio, ficha y popup móvil. Los textos de distancia se ajustan a las vistas existentes sin desbordamiento y conservan botones y créditos accesibles.
- El control de integridad extraído del workflow pasó: LCOV con 96 fuentes, sin duplicados y con contadores consistentes. Incluye la utilidad, el componente, las integraciones y el runner de navegador con cobertura V8 fusionada.

| Archivo | Líneas | Ramas |
| --- | --- | --- |
| `src/utils/distancias.js` | 100 % (16/16) | 100 % (17/17) |
| `src/components/DistanciaPrestador.jsx` | 100 % (2/2) | 100 % (2/2) |
| `src/components/mapa/MapaPrestadores.jsx` | 100 % (166/166) | 95,61 % (109/114) |
| `src/components/BuscadorPrestadores.jsx` | 100 % (53/53) | 96,07 % (49/51) |
| `scripts/qa/navegador.mjs` | 95,25 % (261/274) | 75,30 % (61/81) |

Reporte global fusionado: 95,76 % de líneas y 89,52 % de ramas. Cruzando las líneas añadidas del diff local con LCOV, más los dos archivos funcionales nuevos, se encontraron 44 líneas ejecutables y 26 ramas cubiertas, sin líneas añadidas pendientes. Este agregado local es 100 %, pero **no sustituye** el porcentaje de código nuevo que SonarCloud calculará tras publicar y analizar la rama. No se modifican reglas, umbrales ni exclusiones.

Archivos de esta corrección: `src/utils/distancias.js`, `src/components/DistanciaPrestador.jsx`, `src/components/BuscadorPrestadores.jsx`, `src/components/DetallePrestador.jsx`, `src/components/FichaPrestadorRemota.jsx`, `src/components/mapa/MapaPrestadores.jsx`, `src/styles/MapaPrestadores.css`, `src/tests/Distancias.test.js`, `src/tests/DistanciaPrestador.test.jsx`, `src/tests/MapaPrestadoresUI.test.jsx`, `scripts/qa/navegador.mjs` y este documento.
