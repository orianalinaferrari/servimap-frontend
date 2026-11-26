# Paginación de prestadores — contrato e integración frontend

Corrección #2, 25/11/2026. Base: `origin/main` en `306bb4f`.
El contrato siguiente fue confirmado por el equipo backend. Las pruebas locales
usan HTTP simulado: no certifican su despliegue ni persistencia real.

## Contrato confirmado

`GET /api/prestadores`, público. La URL base contiene solo el origen; el servicio
agrega `/api/prestadores`. Query: `page` entero >= 1 (default 1), `limit` entero
1–50 (default 50). Valores inválidos: HTTP 400.

```json
{"registros": [], "totalRegistros": 0, "pagina": 1, "limite": 50, "totalPaginas": 0}
```

Los filtros de oficio, texto, radio, calificación y disponibilidad preceden a la
paginación. Orden: nombre y desempate por id. Una página inexistente devuelve
registros vacíos y los totales correspondientes. No se cambia el contrato de
`GET /api/prestadores/mapa`, de la ficha ni del perfil privado por analogía.

## Implementación y compatibilidad

- `listarPrestadores` envía inicialmente `page=1&limit=50`. Normaliza en un único
  lugar y valida contenedor, registros y metadatos antes de adaptar los perfiles.
- La respuesta interna contiene `registros`, los cuatro metadatos del contrato
  y `paginada`. Para un array antiguo, `paginada:false` y metadatos null: su
  longitud no informa el total global. No aparecen controles de paginación.
- La UI muestra total confirmado, página, anterior/siguiente, carga, error y
  reintento. Una página fuera de rango ofrece volver a la primera; no se recorre
  automáticamente el resto ni se corrigen totales inventados.
- Búsqueda y filtros reinician en 1. Se conserva debounce de 300 ms y se descartan
  respuestas de efectos anteriores. La carga inicial se reutiliza, evitando una
  segunda petición inmediata al montar el buscador. Las peticiones en curso no
  se abortan: las respuestas obsoletas se ignoran.
- En modo paginado, texto/oficio/calificación/disponibilidad los resuelve el
  servidor; no se filtra nuevamente la página con semánticas locales distintas.
- La compatibilidad con arrays es temporal y no habilita páginas posteriores
  en un servidor antiguo. También debe probarse durante el despliegue coordinado.

## Limitaciones explícitas y decisiones pendientes

Zona y presupuesto se conservan como filtros locales sobre la página recibida.
No se envían parámetros nuevos ni se atribuyen sus coincidencias al total remoto.
La UI avisa que puede haber coincidencias en otras páginas; las opciones de zona
provienen de registros recibidos, no de un catálogo global confirmado. El backend
debe confirmar soporte/semántica remota antes de ofrecer búsqueda global por ellos.

El mapa conserva su endpoint independiente, sin parámetros de filtros nuevos y
sin intersectar marcadores con los IDs de la página. Presenta las ubicaciones
públicas recibidas, incluso con filtros activos, acompañado de una aclaración.
No se afirma que sean todas las coincidencias globales. Su alcance y filtros
admitidos siguen pendientes de confirmación backend. Se preservan selección,
ficha, referencia manual/GPS y cálculo de distancias; no se recuperan masivamente
páginas para rellenar el mapa.

## Pruebas y validación previa al despliegue

`PaginacionPrestadores.test.jsx` cubre normalización antigua/nueva, metadatos,
respuestas inválidas, 0/1/50/>50, página inexistente, navegación, filtros locales,
reinicio de página, respuestas fuera de orden, HTTP 400/500, reintento, mapa
independiente y ausencia de totales ficticios. Se conservan pruebas de zona nula,
fotos, reputación, coordenadas y apertura de fichas; los consumidores directos
del servicio en tests leen ahora `registros`.

Antes de promover:

1. Usar Node 24.x y dependencias del lockfile, sin cambiar engines para ocultar
   incompatibilidades. La máquina auditada tiene Node 26.13.0; una ejecución en
   esa versión no sustituye la validación en Node 24 de CI.
2. Ejecutar `npm test`, `npm run lint` y `npm run build`. Si corresponde a CI,
   ejecutar los scripts existentes de cobertura/QA con API simulada.
3. En preview autorizada, comprobar ambos formatos durante la transición,
   navegación, filtros, errores, CORS, teclado y anchos 320/390/768/1365.
4. Verificar con backend totales, orden y filtros sobre datos de más de 50
   prestadores. No dar por certificada esa integración a partir de mocks.
5. Coordinar publicación frontend/backend. Resolver mapa/filtros locales o
   mantener visibles las limitaciones documentadas, sin prometer soporte pendiente.

No se modifican backend, dependencias, variables de entorno ni Centro de ayuda.

## Validación local ejecutada el 25/11/2026

- Node disponible: 26.13.0. No se encontró Node 24 en PATH ni en las ubicaciones
  habituales revisadas; no se instaló ni cambió Node globalmente.
- `npm run test:coverage`: 905 tests aprobados en 83 archivos; 41 casos pertenecen
  al nuevo archivo de paginación. Incluye ambos formatos, carrera de búsqueda y
  de página, limpieza con petición pendiente y mapa malformado aislado.
- `npm run lint`: sin errores ni advertencias. `npm run build`: aprobado con el
  aviso existente de chunks mayores a 500 kB de MapLibre. `git diff --check`: limpio.
- `npm run test:coverage:qa`: primer intento falló antes de las verificaciones por
  `Timeout CDP: Runtime.enable`. El reintento con permisos ampliados completó el
  recorrido existente: 107 verificaciones generales, 16 rutas SPA, 55 de ayuda,
  50 de cliente, 67 de prestador y 65 de lecturas de navegador contra fixture local.
  Sin errores JavaScript reportados ni escrituras productivas. La cartografía
  emitió advertencias de filtros con null; no se modificó su estilo externo.
- Cobertura combinada unitaria/QA: 96,15 % de líneas y 90,59 % de ramas, 100 fuentes.
  Es cobertura local global, no evidencia de SonarCloud ni de integración real.
- El QA de navegador existente usa fixtures del contrato anterior; la paginación
  nueva se verifica con HTTP simulado en Vitest. Sigue pendiente su aceptación
  en navegador contra el backend coordinado, además de CI con Node 24.
