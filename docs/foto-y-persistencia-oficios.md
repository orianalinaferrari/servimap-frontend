# Foto de perfil y confirmación de oficios — 01/11/2026

Rama local: `fix/foto-perfil-prestador`. Se preservan los cambios anteriores de visualización de fotos. Sin commit, push, merge ni PR. Solo se modifica el frontend.

## Evidencia del contrato real

Se consultaron en modo lectura el [Swagger desplegado](https://servimap-backend.vercel.app/api-docs/) (su `swagger-ui-init.js`) y el código público de la rama predeterminada `develop`, SHA `a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c`:

- [Servicios de prestadores](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/src/services/prestadoresService.js).
- [Controladores](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/src/controllers/prestadoresController.js).
- [Rutas](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/src/routes/prestadoresRouter.js).
- [Configuración de Express](https://github.com/valenbalda/servimap-backend/blob/a9621bab013dc0f03bbe4b7df7550b0cca8fdf4c/src/app.js).

El SHA del código fuente no certifica el SHA desplegado. El contrato publicado coincide en los endpoints y formatos relevantes.

### Foto

`PUT /api/prestadores/me` recibe JSON autenticado. `fotoPerfil` admite texto; el controlador lo recorta y el servicio lo persiste. No hay ruta de upload ni middleware multipart en el código revisado; tampoco un contrato de subida documentado ni implementación de subida en este frontend. El perfil privado, listado y ficha pública incluyen `fotoPerfil`.

Una lectura real del listado y de `/api/prestadores/d30a98c4-5fc1-475d-b7ca-c19f213c4f8c` devolvió `fotoPerfil: null` y `oficios: [{"id":"e948ed35-db56-45de-b0ec-9834e2a1b971","nombre":"Plomero/a"}]`. No se consultaron perfiles privados ni se escribieron datos reales. Este caso público no certifica fotos existentes ni la persistencia privada de oficios.

El campo visible de URL se reemplaza por un selector con vista previa local, MIME/extensión JPG/JPEG/PNG/WebP y tope local de 5 MiB. Este tope protege la vista previa; no es un límite de subida certificado por el backend. Los object URLs se liberan al reemplazar/quitar/salir. La imagen existente continúa mostrándose y conserva respaldo ante fallos.

Mientras se selecciona un archivo se informa que no se guardará, se bloquea el envío y se permite quitar la selección para guardar los demás campos. El PUT omite `fotoPerfil`, conservando el valor persistido. Nunca se envían archivos, base64 ni `blob:` al contrato de texto.

**Dependencia pendiente:** el backend debe proporcionar almacenamiento persistente y un contrato de subida (ruta/método/autenticación, tipos/tamaños permitidos, respuesta con URL accesible y comportamiento de reemplazo), o un mecanismo autorizado equivalente. No se implementó ni inventó ese contrato. La selección y vista previa funcionan; la subida y persistencia de archivos NO están solucionadas.

### Oficios

- Catálogo público: `GET /api/oficios` → array de objetos con `id`, `nombre`, etc.
- Consulta propia: `GET /api/prestadores/me`, Bearer → perfil con `id` y `oficios: [{id,nombre}]`.
- Guardado: `PUT /api/prestadores/me/oficios`, Bearer, JSON `{oficioIds: ["id", ...]}` → perfil con `oficios: [{id,nombre}]`. Se admite la lista vacía.
- El servicio backend revisado valida oficios activos, reemplaza relaciones mediante una transacción y vuelve a consultar el perfil por el ID del usuario autenticado.

No se encontró una conversión a `oficioIds` errónea, un ID de usuario ajeno ni almacenamiento local de oficios en el flujo productivo. El token vigente se envía mediante `apiClient`; una prueba verifica el Bearer tanto en PUT como en GET.

**Defecto frontend demostrado:** cualquier PUT exitoso se consideraba confirmación sin cotejar los IDs devueltos ni comprobar una lectura posterior. Un 200 con `oficios: []` podía borrar la selección y anunciar éxito. Un PUT correcto seguido de un GET inconsistente tampoco se detectaba al guardar. Las pruebas anteriores simulaban un servidor siempre consistente y no cubrían esos casos.

Ahora se comparan los IDs (sin depender del orden), se verifica el mismo perfil con un GET posterior sin caché de navegador y solo entonces se anuncia éxito. Una respuesta inválida/inconsistente o error conserva la selección en pantalla y no anuncia persistencia. El GET propio utiliza `cache: 'no-store'`; esto evita reutilización de caché del navegador, pero no demuestra que esa fuera la causa en producción ni corrige una caché incorrecta del servidor. La carga inicial rechaza listas con estructura inválida. Se mantiene la protección existente contra respuestas de instancias desmontadas y se limpia el éxito al quitar un oficio.

**No se atribuye la pérdida real a una causa no comprobada:** falta una sesión autorizada y una secuencia real PUT→GET→salir/entrar→GET. Si los IDs enviados y confirmados difieren de los consultados, corresponde revisar en backend/despliegue la transacción, la base/entorno efectivo, la identidad y la caché del servidor. No se oculta el problema usando React o almacenamiento del navegador como persistencia.

## Validación y reproducción manual

Las pruebas usan HTTP simulado y no escriben en producción. Cubren uno/varios oficios, desmontar y restablecer sesión, encabezados JWT, 400/401/500, PUT incoherente y GET posterior vacío/fallido, respuestas antiguas, selección/validación/vista previa/reemplazo/liberación de fotos, bloqueo de falsa subida y conservación de fotos persistidas. Esto no certifica persistencia real.

Resultados locales: 53 pruebas dirigidas aprobadas en 7 archivos; revalidación posterior de las dos suites nuevas: 22/22; suite completa: **643/643 en 72 archivos**. `npm.cmd run lint`, `npm.cmd run build` y `git diff --check` aprobados. Build conserva el aviso conocido de tamaño de MapLibre. Se ejecutó con Node local v22.19.0; el proyecto declara Node 24.x, por lo que corresponde repetir en Node 24/CI antes de integrar. La suite incluye autenticación, panel/perfil, ficha, directorio/mapa y roles; no se realizó un recorrido autenticado real.

Archivos de esta corrección: `src/components/prestador/FormularioPerfilPrestador.jsx`, `src/components/prestador/SelectorFotoPrestador.jsx`, `src/services/prestadoresService.js`, `src/pages/OficiosPrestador.jsx`, `src/tests/FotoPrestador.test.jsx`, `src/tests/SelectorFotoPrestador.test.jsx`, `src/tests/PersistenciaOficios.test.jsx` y este informe. Se preservan los cambios previos en BuscadorPrestadores, DetallePrestador, VistaPerfilPrestador, FotoPrestador.jsx y FotoPrestador.css; la prueba previa de foto se adapta al nuevo selector sin quitar la cobertura de visualización.

Para probar los cambios, usar este checkout local con `VITE_API_URL=https://servimap-backend.vercel.app` y `npm.cmd run dev -- --port 5173 --strictPort`, o una preview autorizada que contenga esta rama. La web publicada no incorpora cambios locales automáticamente. Confirmar que el backend permite el origen utilizado mediante CORS.

1. Coordinar con el equipo una cuenta PRESTADOR descartable y autorización para modificar únicamente su perfil/oficios, preferentemente en un entorno de prueba. El responsable puede registrarla desde la UI de registro eligiendo PRESTADOR con datos de prueba acordados, sin datos de otra persona. No crearla automáticamente en producción.
2. Iniciar sesión personalmente en un navegador/perfil aislado. No enviar contraseñas, tokens, cookies ni archivos HAR completos por el chat. Si se habilita una sesión de navegador controlada por la herramienta, iniciar sesión allí personalmente y autorizar expresamente las acciones sobre la cuenta de prueba; no se dispone de esa sesión en esta revisión. Como alternativa, ejecutar estos pasos y compartir solo estados HTTP y cuerpos redactados.
3. Abrir Mis oficios. En Network, comprobar `GET /api/prestadores/me` 200 y su array `oficios`; identificar por separado el ID del perfil y los IDs de oficio.
4. Agregar un oficio (por ejemplo Gasista, si aparece en el catálogo), guardar y comprobar PUT a `/api/prestadores/me/oficios` con `{oficioIds:[...]}` y Bearer presente (sin copiar su valor). Comparar los IDs enviados con los de la respuesta PUT y del GET de verificación. El éxito debe aparecer después de ambas confirmaciones.
5. Salir al panel, regresar, recargar y cerrar/iniciar sesión con la misma cuenta. Verificar en cada GET los mismos IDs; repetir con varios oficios. Si difieren, compartir únicamente URL de entorno, hora, estados, ID de perfil e IDs de oficios enviados/devueltos (redactando datos personales). No probar errores modificando datos ajenos.
6. Abrir perfil → Editar perfil. Seleccionar JPG/PNG/WebP válido, ver preview; reemplazarlo; probar GIF y un archivo mayor a 5 MiB. La UI debe rechazar estos últimos. Con un archivo pendiente, Guardar queda bloqueado y no debe haber PUT ni éxito de foto. Quitar selección, editar otro dato y guardar: el PUT no debe contener fotoPerfil y la foto persistida debe conservarse.
7. Para una cuenta con una URL de foto ya persistida, recargar perfil y comprobar que listado y ficha muestran esa URL, o respaldo si falla. El caso nuevo archivo→guardar→recargar con la misma foto solo podrá aceptarse tras implementar el contrato de subida pendiente.
