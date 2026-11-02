# Pantalla en blanco al buscar — 01/11/2026

Rama `fix/foto-perfil-prestador`; se preservan todos los cambios locales anteriores de foto y oficios. Sin modificar backend ni publicar cambios.

## Causa comprobada

`src/utils/filtrarPrestadores.js:16` pasaba `prestador.zonaCobertura` directamente a `normalizar`. Su línea 3 ejecutaba `.toLowerCase()` sobre `null`. La excepción se propagaba desde `aplicarFiltrosPrestadores` al `useMemo` de `BuscadorPrestadores` (línea 53), durante el render, y React desmontaba la aplicación.

La búsqueda por nombre usa un OR con cortocircuito: si el nombre coincide, no se evalúa la zona y no falla. Con texto vacío tampoco se evalúan campos. Esto explica por qué depende de lo escrito.

Se leyó `GET https://servimap-backend.vercel.app/api/prestadores?limit=50`: devolvió cinco prestadores, uno con `zonaCobertura: null` (ID `d30a98c4-5fc1-475d-b7ca-c19f213c4f8c`). Es un valor admitido por el contrato público, no un motivo para exigir cambios al backend. Se reprodujo el fallo con esa respuesta real, adaptada por `adaptarPrestador`: buscar `plom` y `zzzz_sin_coincidencia` arrojaba `TypeError: Cannot read properties of null (reading 'toLowerCase')`.

También se reprodujo en Chrome headless, perfil temporal aislado, sobre el frontend local en `http://localhost:5173/prestadores` y API pública real: escribir `plom` dejó `#root` sin hijos y registró la misma traza. El recorrido bloqueaba escrituras y credenciales; no se utilizó una sesión personal. Se aprovechó el servidor local existente, sin detenerlo ni cambiar su configuración.

## Cambio mínimo y regresiones

Única línea productiva modificada para este defecto:

```js
normalizar(prestador.zonaCobertura ?? '').includes(terminoLimpio)
```

No se inventa una zona ni se modifica la respuesta guardada: solo se trata el dato ausente como texto vacío para comparar.

`src/tests/BusquedaZonaNula.test.jsx` agrega cinco pruebas: zona null/undefined; búsqueda por oficio, nombre, texto vacío y sin coincidencias; render tras escribir y limpiar; combinación de filtros con tarjetas, marcadores y ficha; descarte de respuestas antiguas al escribir rápido. Las cinco fallaron antes del cambio con la excepción original y pasaron después. Las respuestas HTTP de estas pruebas son simuladas; la reproducción y verificación de navegador que siguen utilizaron la API real.

## Verificación posterior con API real

Chrome, sin interceptar respuestas de API ni usar fixtures, confirmó:

- Listado y búsqueda `q=plom`: HTTP 200; una tarjeta visible, sin desmontar React.
- Filtros `oficioId` y `disponible=true` junto con texto: HTTP 200.
- Búsqueda sin coincidencias y limpiar: pantalla utilizable y recuperación de tarjetas.
- Apertura de ficha pública desde la tarjeta y vuelta al listado: HTTP 200.
- Mapa real con atribución OpenStreetMap y cuatro marcadores.
- Cero excepciones JavaScript; cero escrituras o credenciales enviadas.

Los reportes y capturas se guardaron temporalmente en `%TEMP%/servimap-busqueda-real-tAyXeG` (antes) y `%TEMP%/servimap-busqueda-real-9TLwqz` (después), cada uno con `resultado.json` y `pantalla.png`. Son artefactos locales temporales, no archivos publicados.

Validación automatizada: **83/83 pruebas dirigidas** en 8 archivos, incluidas foto y oficios; **648/648 pruebas de la suite completa** en 73 archivos. Lint, build y `git diff --check` aprobados. Build mantiene el aviso conocido de tamaño de MapLibre. Ejecución local con Node v22.19.0; repetir en Node 24/CI, versión declarada por el proyecto, antes de integrar.

El defecto de búsqueda está reproducido y corregido con datos y tráfico real. No requiere cambios del backend. Para esta entrega la foto se administra por URL mediante el contrato existente; la subida de archivos es una mejora futura fuera del alcance. El 02/11/2026 el usuario confirmó como APROBADAS las pruebas manuales con el backend real de foto por URL (guardar, avatar inmediato, recargar, reemplazar y eliminar), persistencia de oficios (guardar, volver al panel, recargar y volver a iniciar sesión) y buscador sin pantalla en blanco. Es evidencia informada por el usuario, sin logs ni respuestas HTTP adjuntas; no implica que el agente haya repetido esas escrituras ni verificado un despliegue específico. Ver [registro y límites de la confirmación](avatar-sesion-foto.md).
