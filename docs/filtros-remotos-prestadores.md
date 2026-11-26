# Zona y presupuesto remotos — preparación del contrato backend #57

Base frontend: `44fe5a9`. El PR backend #57 está abierto: este trabajo no afirma
que se haya integrado ni desplegado. No cambia el mapa ni los otros dominios.

## Contrato

`GET /api/prestadores` conserva `page` >= 1 y `limit` 1–50 (50 inicialmente).
Agrega `zona` exacta sin distinguir mayúsculas/minúsculas, no vacía y máximo 100
caracteres; `presupuesto` finito >= 0, con `precioMin <= presupuesto` y exclusión
de precios ausentes. Los filtros preceden a la paginación. Errores inválidos: 400.
Respuesta: `registros,totalRegistros,pagina,limite,totalPaginas`.

No se envía `precioMax` ni se inventan endpoints. Vaciar zona/presupuesto elimina
el parámetro; el texto de zona se recorta, pero no se le quitan acentos. Cero se
envía como `presupuesto=0`, no como filtro ausente. Los errores HTTP se muestran.

## Activación explícita, desactivada por defecto

El servicio no deduce soporte por un array, un objeto paginado ni por un 200.
El PR #55 ya devuelve el objeto paginado sin implementar estos dos filtros.

Se exige una declaración explícita de despliegue verificado, ligada al origen:

```text
VITE_PRESTADORES_CONTRATO_FILTROS=zona-presupuesto-v1
VITE_PRESTADORES_FILTROS_API_ORIGIN=<mismo origen exacto de VITE_API_URL>
```

Son opciones públicas de build, no credenciales ni respuestas del servidor.
Ambas ausentes/vacías: modo local. Activación parcial, versión distinta u origen
diferente: error controlado, sin pedir el listado. No se acepta `true` como versión.
Con activación completa se exige respuesta paginada; recibir el array anterior
produce un error visible y nunca una degradación silenciosa con totales falsos.

**Este cambio no configura ni activa esas opciones en ningún entorno real.**
Una declaración manual no puede demostrar por sí sola la versión del servidor.
La activación real queda detenida hasta contar con estas evidencias:

1. Backend informa el commit/release que incorpora #57 y su URL desplegada.
   Vincular ambos en la revisión; preferir una URL de deployment inmutable para
   pruebas. La rama del PR o la aprobación de tests no demuestran despliegue.
2. Sobre ese origen exacto y datos autorizados conocidos, verificar antes del build:
   una zona que no aparezca en la primera página, más de 50 coincidencias, totales
   filtrados y página 2; presupuesto 0/decimal, exclusión de precio null, zona exacta
   con variantes de mayúsculas, vacío omitido y errores 400 con valores inválidos.
   No basta comprobar el formato de respuesta o enviar parámetros ignorados.
3. Registrar evidencia de esas lecturas y revisión conjunta frontend/backend;
   recién entonces autorizar las dos opciones y generar el build de preview.
4. Comprobar las peticiones y resultados en ese preview antes de promover nada.
   Si cambia la versión/origen o hay rollback backend, retirar ambas opciones,
   reconstruir y repetir la verificación antes de volver a activar.

La API actual no proporciona una señal de capacidad/versionado comprobable por
el cliente. No se implementó detección automática. Si se necesita una garantía
automática ante rollback en el mismo origen, backend debe acordar una señal
inequívoca de versión/capacidades; no se inventa aquí. Configurar manualmente el
modo remoto contra #55 sería incorrecto y no se puede detectar por el sobre JSON.

## Comportamiento de interfaz y compatibilidad

- Modo local por defecto: admite array antiguo sin totales globales y objeto #55
  con zona/precio limitados a la página. Conserva aclaraciones, select de zonas y
  totales que excluyen expresamente los filtros locales. No envía zona/presupuesto.
- Modo remoto declarado: zona es texto libre con sugerencias de registros recibidos,
  explícitamente parciales. Se puede buscar una zona ausente de esas sugerencias.
- Todos los filtros del listado se resuelven en backend en modo remoto; no se
  vuelven a aplicar localmente. El total es el confirmado por ese contrato.
- Cambios de zona/presupuesto reinician la página. La identidad de petición incluye
  ambos parámetros; mantiene debounce de 300 ms y descarte de lecturas anteriores.
- Presupuesto vacío quita el filtro; inválido/negativo/no finito muestra validación,
  detiene la consulta y no muestra resultados/totales anteriores como coincidentes.
- `/api/prestadores/mapa` conserva endpoint, parámetros, datos y reglas existentes.
  El aviso de independencia sigue visible. No se recorta por IDs ni se descargan
  masivamente páginas del listado. No se promete coincidencia global mapa/listado.

## Verificación

`src/tests/FiltrosRemotosPrestadores.test.jsx` usa solo HTTP simulado. Comprueba
activación por versión/origen, incompatibilidades, array antiguo y #55, filtros
previos a paginar con más de 50 coincidencias, presupuesto cero/vacío/inválido,
zona no sugerida, totales, respuestas tardías, errores y mapa independiente.
Se conservan los casos de paginación, PE-01 y los flujos existentes.

Ejecutar con scripts del repositorio: pruebas dirigidas, suite con cobertura,
lint y build. Los resultados simulados no certifican integración real. La máquina
local conserva Node 26.13.0; verificar Node 24 en CI antes de publicar/integrar.

## Resultados locales de esta preparación

- Pruebas dirigidas de filtros remotos, paginación y zona nula: 70/70 aprobadas.
- `npm run test:coverage`: 929 tests aprobados en 84 archivos, con 24 casos nuevos.
- `npm run lint`: sin errores ni advertencias. `npm run build`: aprobado, conserva
  el aviso conocido de chunks mayores a 500 kB de MapLibre.
- `npm run test:coverage:qa`: aprobado con API simulada/fixtures locales; 107
  verificaciones generales, 16 rutas SPA, 55 de ayuda, 50 de cliente, 67 de prestador
  y 65 de lecturas de navegador. No se hicieron escrituras productivas. El estilo
  cartográfico externo conserva advertencias de filtros con null.
- Cobertura combinada local: 96,20 % de líneas y 90,90 % de ramas, 101 fuentes.
  La unitaria por separado fue 70,33 % de líneas y 83,30 % de ramas, incluyendo
  scripts QA que todavía no habían ejecutado sus recorridos de navegador.
- Validaciones ejecutadas con Node 26.13.0; no se instalaron dependencias.
- No hay análisis Sonar de esta rama sin publicar. El QA existente verifica el
  modo compatible; el nuevo modo remoto se prueba en Vitest con HTTP simulado.
- `git diff --check` sin errores. Integración y activación real del #57 pendientes
  de las evidencias y autorización detalladas arriba.
