# Foto de perfil y confirmación de oficios — 01/11/2026

Rama local: `fix/foto-perfil-prestador`, base `254a0d08`. Ajuste de alcance posterior incluido en el segundo commit local, sin push, merge ni PR. Se preservan la visualización de fotos, la verificación de oficios y la corrección del buscador. Solo se modifica el frontend.

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

**Decisión definitiva de la entrega:** usar una URL pública de imagen. La subida desde archivos queda fuera del alcance y se documenta como mejora futura. Se retiran el selector, la vista previa local y sus pruebas exclusivas. Se conservan FotoPrestador y sus estilos compartidos, usados en directorio, ficha pública y perfil autenticado, con iniciales/ícono de respaldo si falta la imagen o falla su carga.

El formulario vuelve a ofrecer «URL de foto de perfil» con la ayuda «Pegá el enlace público de una imagen para usarla como foto de perfil». Antes del PUT se recortan espacios y se validan URLs absolutas HTTP/HTTPS sin credenciales. Se rechazan rutas relativas, URLs inválidas y esquemas `blob:`, `data:`, `javascript:` o FTP. No se agrega almacenamiento externo ni se envían archivos.

Guardar otros datos conserva la URL; ingresar otra la reemplaza; vaciar el campo envía `fotoPerfil: ""` para quitarla. Estas operaciones usan el PUT JSON existente. En el controlador revisado, `validarTextos` exige texto para fotoPerfil, pero no prohíbe la cadena vacía (esa restricción corresponde a descripción); `limpiarDatos` conserva el campo recortado y el servicio lo persiste. No se envía `null` ni se inventa un endpoint de borrado.

**Estado y mejora futura:** no hace falta modificar el backend para administrar la URL. El 02/11/2026 el usuario confirmó como APROBADO guardar, mostrar inmediatamente en el avatar, recargar, reemplazar y eliminar la foto con el backend real. Es una confirmación manual aportada por el usuario, sin logs ni respuestas HTTP adjuntas; el agente no ejecutó esas escrituras. Las pruebas de escritura automatizadas usan HTTP simulado. La URL debe ser accesible públicamente desde el navegador para mostrar la imagen. Para una futura subida de archivos sí será necesario acordar almacenamiento persistente y un contrato de subida con autenticación, tipos/tamaños, URL de respuesta y reemplazo; no es una dependencia bloqueante de esta entrega por URL.

Integración posterior de avatares (02/11/2026): el encabezado común del PRESTADOR recibe la URL del perfil privado mediante AuthContext y se actualiza al confirmar el PUT, con limpieza y descarte de respuestas de otras sesiones. CLIENTE conserva iniciales por falta de contrato de foto. Ver [sincronización, pruebas y confirmación manual del usuario](avatar-sesion-foto.md).

### Oficios

- Catálogo público: `GET /api/oficios` → array de objetos con `id`, `nombre`, etc.
- Consulta propia: `GET /api/prestadores/me`, Bearer → perfil con `id` y `oficios: [{id,nombre}]`.
- Guardado: `PUT /api/prestadores/me/oficios`, Bearer, JSON `{oficioIds: ["id", ...]}` → perfil con `oficios: [{id,nombre}]`. Se admite la lista vacía.
- El servicio backend revisado valida oficios activos, reemplaza relaciones mediante una transacción y vuelve a consultar el perfil por el ID del usuario autenticado.

No se encontró una conversión a `oficioIds` errónea, un ID de usuario ajeno ni almacenamiento local de oficios en el flujo productivo. El token vigente se envía mediante `apiClient`; una prueba verifica el Bearer tanto en PUT como en GET.

**Defecto frontend demostrado:** cualquier PUT exitoso se consideraba confirmación sin cotejar los IDs devueltos ni comprobar una lectura posterior. Un 200 con `oficios: []` podía borrar la selección y anunciar éxito. Un PUT correcto seguido de un GET inconsistente tampoco se detectaba al guardar. Las pruebas anteriores simulaban un servidor siempre consistente y no cubrían esos casos.

Ahora se comparan los IDs (sin depender del orden), se verifica el mismo perfil con un GET posterior sin caché de navegador y solo entonces se anuncia éxito. Una respuesta inválida/inconsistente o error conserva la selección en pantalla y no anuncia persistencia. El GET propio utiliza `cache: 'no-store'`; esto evita reutilización de caché del navegador, pero no demuestra que esa fuera la causa en producción ni corrige una caché incorrecta del servidor. La carga inicial rechaza listas con estructura inválida. Se mantiene la protección existente contra respuestas de instancias desmontadas y se limpia el éxito al quitar un oficio.

**Confirmación manual posterior:** el 02/11/2026 el usuario informó como APROBADO guardar oficios, volver al panel, recargar y volver a iniciar sesión con el backend real. No se aportaron trazas PUT/GET ni se atribuye retrospectivamente la pérdida original a una causa no comprobada. Si el problema reaparece con IDs confirmados distintos de los consultados, corresponde revisar en backend/despliegue la transacción, la base/entorno efectivo, la identidad y la caché del servidor. No se oculta el problema usando React o almacenamiento del navegador como persistencia.

## Validación y reproducción manual

Las pruebas usan HTTP simulado y no escriben en producción. Cubren uno/varios oficios, desmontar y restablecer sesión, encabezados JWT, 400/401/500, PUT incoherente y GET posterior vacío/fallido, respuestas antiguas, validación de URL de foto, conservar/reemplazar/quitar, recuperación tras volver al perfil, errores sin éxito y respaldos de imagen. Esto no certifica persistencia real.

Resultados históricos anteriores al ajuste de alcance: 643/643 pruebas en 72 archivos con Node v22.19.0; posteriormente 648/648 al incorporar el buscador y 94 pruebas relevantes con Node 24.22.2 en la preparación de integración. Esos conteos incluyen el selector retirado y no representan la validación del nuevo formulario URL. No se realizó un recorrido autenticado real.

Validación del alcance definitivo por URL, con **Node 24.22.2**: **59/59 pruebas relevantes** en 6 archivos y **655/655 pruebas de la suite completa** en 72 archivos; lint, build y `git diff --check` aprobados. Build conserva únicamente el aviso conocido de tamaño de MapLibre. Se comprueba que los archivos de las correcciones de oficios, buscador y visualización de fotos no cambian respecto de `254a0d08`.

Archivos del ajuste de alcance: `src/components/prestador/FormularioPerfilPrestador.jsx`, `src/tests/FotoPrestador.test.jsx`, este informe y `docs/busqueda-zona-nula.md`. Se eliminan exclusivamente `src/components/prestador/SelectorFotoPrestador.jsx` y `src/tests/SelectorFotoPrestador.test.jsx`. Se preservan los componentes/estilos de visualización de fotos, el servicio y pantalla de oficios y la corrección/pruebas del buscador.

Para probar los cambios, usar este checkout local con `VITE_API_URL=https://servimap-backend.vercel.app` y `npm.cmd run dev -- --port 5173 --strictPort`, o una preview autorizada que contenga esta rama. La web publicada no incorpora cambios locales automáticamente. Confirmar que el backend permite el origen utilizado mediante CORS.

1. Coordinar con el equipo una cuenta PRESTADOR descartable y autorización para modificar únicamente su perfil/oficios, preferentemente en un entorno de prueba. El responsable puede registrarla desde la UI de registro eligiendo PRESTADOR con datos de prueba acordados, sin datos de otra persona. No crearla automáticamente en producción.
2. Iniciar sesión personalmente en un navegador/perfil aislado. No enviar contraseñas, tokens, cookies ni archivos HAR completos por el chat. Si se habilita una sesión de navegador controlada por la herramienta, iniciar sesión allí personalmente y autorizar expresamente las acciones sobre la cuenta de prueba; no se dispone de esa sesión en esta revisión. Como alternativa, ejecutar estos pasos y compartir solo estados HTTP y cuerpos redactados.
3. Abrir Mis oficios. En Network, comprobar `GET /api/prestadores/me` 200 y su array `oficios`; identificar por separado el ID del perfil y los IDs de oficio.
4. Agregar un oficio (por ejemplo Gasista, si aparece en el catálogo), guardar y comprobar PUT a `/api/prestadores/me/oficios` con `{oficioIds:[...]}` y Bearer presente (sin copiar su valor). Comparar los IDs enviados con los de la respuesta PUT y del GET de verificación. El éxito debe aparecer después de ambas confirmaciones.
5. Salir al panel, regresar, recargar y cerrar/iniciar sesión con la misma cuenta. Verificar en cada GET los mismos IDs; repetir con varios oficios. Si difieren, compartir únicamente URL de entorno, hora, estados, ID de perfil e IDs de oficios enviados/devueltos (redactando datos personales). No probar errores modificando datos ajenos.
6. Abrir perfil → Editar perfil. Pegar una URL pública HTTP/HTTPS, guardar y verificar PUT JSON con `fotoPerfil` y respuesta confirmada. Recargar y comprobar la misma URL en GET, perfil, directorio y ficha. Reemplazar la URL y repetir. Guardar otro dato sin cambiar la URL debe conservarla. Vaciar el campo debe enviar `fotoPerfil: ""`; tras guardar/recargar debe verse el avatar de respaldo.
7. Probar una ruta relativa, URL inválida o esquema no permitido: debe mostrarse error sin PUT ni éxito. Una URL HTTP/HTTPS de imagen que no carga debe mostrar el respaldo sin romper la pantalla. No debe existir un selector de archivos ni una vista previa local. Estos pasos se conservan como guía de repetición; la confirmación manual del usuario y sus límites se registran en [el informe de avatares](avatar-sesion-foto.md).
