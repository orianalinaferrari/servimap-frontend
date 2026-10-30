# Mapa gratuito de ServiMap

## Solución

MapLibre GL JS muestra cartografía vectorial de OpenStreetMap servida por la instancia pública de **OpenFreeMap**, estilo **Liberty** (`https://tiles.openfreemap.org/styles/liberty`). El estilo claro mantiene la lectura del mapa y la interfaz aplica crema, verde petróleo y rosa de ServiMap. Los créditos de OpenMapTiles/OpenStreetMap suministrados por el estilo permanecen visibles mediante el control de atribución de MapLibre.

No requiere cuenta, API key, tarjeta ni facturación. No hay variables de mapas que configurar; `.env.example` conserva únicamente la configuración HTTP que ya tenía el proyecto. No se modifican `.env.local` ni archivos privados.

## Condiciones verificadas el 29/10/2026

- [OpenFreeMap](https://openfreemap.org/) permite expresamente mapas web/apps y uso comercial. Su instancia pública declara actualmente que no limita vistas o solicitudes y no exige registro ni claves. Esto describe su política publicada, **no una garantía de capacidad o disponibilidad ilimitada**.
- Los [términos](https://openfreemap.org/tos/) (actualizados el 14/10/2026) exigen uso legal y responsable; prohíben interferir con el servicio y la extracción automatizada fuera de las excepciones indicadas. El servicio se entrega sin garantías ni SLA y puede discontinuarse sin aviso. Los términos pueden cambiar: revisarlos antes de publicar o aumentar significativamente el tráfico.
- Se conservan las atribuciones exigidas por OpenMapTiles y OpenStreetMap. OpenFreeMap indica que MapLibre las incorpora automáticamente desde sus fuentes.
- Esta aplicación solo solicita los recursos que requiere el mapa interactivo; no implementa descargas masivas, precarga de áreas ni modo offline. Si se implementara offline posteriormente, la política actual limita cada descarga a 3.000 tiles o 50 MB, con hasta 4 solicitudes paralelas y un User-Agent único; para cantidades mayores se debe contactar al proveedor.
- Las solicitudes cartográficas van directamente desde el navegador al proveedor/CDN: aplica su [política de privacidad](https://openfreemap.org/privacy/). No se envían nombres, perfiles ni datos del backend a un servicio de geocodificación.

Si la disponibilidad deja de ser suficiente, OpenFreeMap ofrece autoalojamiento de su infraestructura abierta, con costos propios de infraestructura. No se configura ni contrata nada aquí. No se usa el servidor estándar `tile.openstreetmap.org` ni endpoints de demostración como servicio de producción.

## Funcionalidad conservada

`MapaPrestadores({ prestadores, onSeleccionar })` recibe los resultados filtrados existentes. `obtenerCoordenadas` conserva la validación de `latitud/longitud` y `lat/lng`; para MapLibre se transforma explícitamente al orden `[longitud, latitud]`. No se agregan prestadores ni coordenadas.

Los marcadores accesibles muestran nombre, oficio/servicio y zona cuando existen. «Ver perfil» usa el callback que abre la ficha actual, sin inventar rutas. «Cómo llegar» abre un enlace externo seguro de Google Maps, sin SDK, clave ni API de rutas paga.

Se mantienen zoom/desplazamiento, geolocalización con permiso y recentrado. Se ajustan los límites a los prestadores; sin coordenadas se conserva Buenos Aires, centro [-58.3816, -34.6037], zoom 11. El estado vacío remite al listado. Los datos de prueba existentes no tienen coordenadas: no se inventan ubicaciones para mostrar marcadores.

El mapa se carga bajo demanda, reutilizando la importación. Se configura el worker local mediante Vite. Se liberan mapa, WebGL, eventos, popups y marcadores al desmontar; ResizeObserver adapta el canvas al contenedor. Fallos de WebGL, red, tiles o carga muestran un aviso, manteniendo el listado disponible. Se requiere un navegador con WebGL compatible y conexión a OpenFreeMap.

## Verificación visual pendiente

Ejecutar `npm run dev`, abrir la URL que informe Vite y revisar zoom, arrastre, créditos y controles con teclado, móvil y escritorio. Probar geolocalización aceptada/rechazada y fallo de red. Para comprobar marcadores se necesitan datos existentes con coordenadas válidas; no agregarlos artificialmente al catálogo. No hace falta configurar Google Cloud ni conectar el backend.

Referencias técnicas: [guía oficial OpenFreeMap/Vite](https://openfreemap.org/quick_start/), [MapLibre](https://maplibre.org/maplibre-gl-js/docs/).

## Diagnóstico de caché Vite (29/10/2026)

Se reprodujo un mapa vacío porque `/node_modules/.vite/deps/maplibre-gl.js` devolvía HTTP 504: el optimizador del servidor seguía referenciando `leaflet`, retirado mientras Vite estaba en ejecución. El registro de Vite mostraba `ENOENT ... node_modules/leaflet/dist/leaflet-src.js`; el navegador informaba `Failed to fetch dynamically imported module`. Positron respondía HTTP 200 con CORS permitido y WebGL estaba disponible.

Se detuvo el servidor de desarrollo usado y se reinició con `npm run dev -- --force --port 5174 --strictPort`, regenerando la caché sin borrar archivos del usuario. Se declara MapLibre en `optimizeDeps.include` para prepararlo desde el inicio. Después de instalar o retirar dependencias, reiniciar Vite y recargar el navegador; si reaparece un 504 de dependencias optimizadas, usar `--force`.

El mapa ahora conserva y registra el error concreto en consola y ofrece su detalle desplegable. Los eventos `idle`/`load` posteriores no borran un fallo reportado. La carga real se comprobó en Chrome: WebGL, worker, estilo, fuentes, sprites, mapa de Buenos Aires y créditos visibles, sin errores de red. No se cambió de proveedor.
