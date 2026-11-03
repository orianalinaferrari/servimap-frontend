# Mejoras de perfiles y navegación

## Preparación y auditoría

Rama `feature/mejoras-perfiles-navegacion`, creada desde `origin/main` actualizado
tras confirmar el PR #38 fusionado y el árbol limpio. No se modifica el PR #29,
el backend ni SonarCloud. No se agregan dependencias ni proveedores de imágenes.

Swagger público revisado el 03/11/2026, HTTP 200:
https://servimap-backend.vercel.app/api-docs/
(definición en `/api-docs/swagger-ui-init.js`).

- `/api/auth` ofrece registro, login y `GET /me`, sin edición de cuenta.
- `PUT /api/prestadores/me` admite descripción, foto por URL (`fotoPerfil`),
  zona, teléfono, WhatsApp, email de contacto, precios, latitud/longitud y
  disponibilidad. No admite nombre, email de cuenta ni DNI. Los oficios tienen
  su propio contrato y navegación, que se conservan.
- No hay endpoint de subida multipart, almacenamiento de imágenes, credenciales
  de subida ni servicio de carga existente en frontend/Swagger/router revisado.
  El repositorio backend consultado no contiene integración de almacenamiento.
- `AuthContext` obtiene el nombre del usuario de API. La foto del prestador se
  recupera del perfil privado y se sincroniza mediante el evento existente tras
  el PUT. El cliente conserva sus iniciales; no tiene campo de foto contratado.

## A. Cambios frontend completamente funcionales

- Navegación y encabezados de cliente/prestador: «Mi espacio». Se elimina el
  enlace duplicado «Mis solicitudes» del header del cliente y «Mis oficios» del
  header del prestador. Se mantienen las rutas, los permisos y los accesos desde
  cada panel; el perfil conserva «Administrar mis oficios».
- La vista del prestador conserva encabezado «Mi perfil», foto circular,
  identidad, descripción, tarjetas de contacto/servicio y calificaciones.
  «Editar perfil» está debajo de las tarjetas, al final del contenido editable.
- El modo edición reutiliza la misma vista y sustituye valores por controles
  en sus lugares. Descripción en identidad; contactos en su tarjeta; zona,
  precios, disponibilidad y coordenadas privadas en servicio. Nombre/email se
  mantienen de solo lectura. Las calificaciones permanecen visibles.
- Guardar y cancelar están al final. Cancelar desmonta el borrador y recupera
  los datos anteriores. Los errores conservan valores ingresados; no se permite
  doble envío. La vista cambia a los datos retornados solo tras respuesta real
  del PUT con el mismo perfil y su lista de oficios.
- Se conserva la validación existente de contactos, precios, coordenadas y URL
  pública HTTP/HTTPS sin credenciales. Se conserva el flujo independiente para
  completar el perfil. La foto por URL sigue funcionando en perfiles anteriores.
- «Quitar foto» en edición limpia la URL del borrador; solo al guardar se envía
  `fotoPerfil: ''`, admitido por el contrato actual. Hasta entonces se conserva
  la imagen confirmada; cancelar mantiene la URL anterior. No implica borrar
  físicamente una imagen de un proveedor externo.
- El evento existente sincroniza el avatar de sesión después del PUT; no se
  guarda imagen en localStorage ni JWT. Sin foto o con imagen fallida siguen las
  iniciales. No se cambia la lógica de AuthContext ni se simula edición de nombre.

## B. Componentes preparados, fuera de las rutas productivas

`FormularioCuenta` admite únicamente nombre; muestra DNI/email de solo lectura,
valida, conserva el borrador ante errores y bloquea envíos duplicados. Recibe un
contrato inyectado en las pruebas, sin URL ni servicio HTTP inventado. Solo llama
a la confirmación al recibir el mismo usuario con el nombre persistido esperado.
No está importado por páginas productivas ni habilita un botón «Editar» del cliente.

`SelectorFotoPerfil` sirve para ambos roles mediante props, sin asumir que ambos
tengan persistencia de foto. Usa `input type="file" accept="image/*"`, vista previa
con Object URL, iniciales o foto anterior por URL. Entrega el `File` solo después
de decodificar la imagen; permite cambiar/cancelar y libera las URLs temporales
al reemplazar o desmontar. Muestra errores de formato, tamaño, lectura y creación
de vista previa. Selección y vista previa no equivalen a una carga exitosa.

Valida JPEG, PNG, WebP y GIF, de 1 byte a 5 MB; rechaza SVG y archivos vacíos.
Es una política local propuesta, no un límite confirmado del backend. La futura
subida debe alinear límites y validar contenido en el servidor. Eliminar solo se
ofrece si se inyecta una operación de eliminación; espera su resultado y conserva
la foto anterior ante errores. El componente no llama a un endpoint ni persiste.

## C. Funciones que no deben habilitarse hasta disponer del backend

### Edición de cliente/cuenta

Definir y publicar en Swagger método/ruta autenticados, campos autorizados
(nombre como mínimo), límites y errores. El usuario se identifica por JWT;
mantener DNI, email, rol e IDs fuera de edición sin contrato explícito. Responder
con el usuario confirmado y permitir verificar persistencia con `/api/auth/me`.
Entonces conectar el componente, revalidar AuthContext y actualizar iniciales;
descartar respuestas de sesiones anteriores. No usar registro como edición.

### Archivos de foto para ambos roles

Definir almacenamiento y contrato de subida/eliminación, propiedad y permisos
por rol, tipos/límites, validación real de imágenes, errores y límites de intentos.
Acordar si la API recibe multipart o entrega una autorización temporal de subida,
sin incluir secretos de almacenamiento en el frontend. No se agrega proveedor
externo sin autorización. Documentar qué URL HTTPS pública confirmada queda en
el perfil y cómo consultar la imagen tras recargar/iniciar sesión.

Para CLIENTE agregar lectura/persistencia de su foto en la cuenta y definir su
sincronización con sesión. Para PRESTADOR conservar URLs históricas y el contrato
`fotoPerfil`; no enviar `File`, `blob:`, base64 ni rutas locales al PUT actual.
Eliminar debe diferenciar quitar la referencia del perfil de borrar el objeto
almacenado. Definir también cancelación, reemplazos y archivos huérfanos si falla
el guardado posterior. El selector preparado no debe conectarse a un guardado
productivo antes de ese acuerdo.

No hay formulario funcional de cambio de contraseña ni edición de DNI/email en
esta rama; siguen fuera del contrato y del alcance de estas mejoras.

## Archivos de esta corrección

Funcionales:

- `src/components/auth/NavegacionRoles.jsx`
- `src/components/prestador/VistaPerfilPrestador.jsx`
- `src/components/prestador/FormularioPerfilPrestador.jsx`
- `src/pages/PanelCliente.jsx`
- `src/pages/PanelPrestador.jsx`
- `src/pages/PerfilPrestador.jsx`
- `src/styles/PrestadorVisual.css`

Preparados sin conexión productiva:

- `src/components/perfil/FormularioCuenta.jsx`
- `src/components/perfil/SelectorFotoPerfil.jsx`

Pruebas y QA:

- `src/tests/NavegacionRoles.test.jsx`
- `src/tests/PanelPrestadorUI.test.jsx`
- `src/tests/PerfilPrestador.test.jsx`
- `src/tests/PreguntasFrecuentes.test.jsx`
- `src/tests/FormularioCuenta.test.jsx`
- `src/tests/SelectorFotoPerfil.test.jsx`
- `scripts/qa/navegador.mjs`
- `scripts/qa/cliente-navegador.mjs`
- `scripts/qa/prestador-navegador.mjs`

Documentación: `docs/mejoras-perfiles-navegacion.md`.

## Validación final local

- Node `26.13.0`; Node 24 no disponible localmente. No se cambió la configuración
  del proyecto para adaptar el runtime.
- Suite completa con `npm run test:coverage`: **793 pruebas aprobadas en 78
  archivos**. Incluye las regresiones de URL/avatar/AuthContext, edición,
  cancelación, errores, cuenta preparada y archivos/vista previa.
- Lint, build y `git diff --check` correctos. El build conserva el aviso conocido
  de tamaño de MapLibre; no se agregaron dependencias.
- `npm run test:coverage:qa` aprobado: **106** controles principales, **40** de
  ayuda, **49** de cliente, **66** de prestador y **65** de lecturas. Build
  estático verificado en **16** rutas SPA. HTTP simulado o fixtures loopback;
  ninguna escritura sobre datos productivos.
- Responsive verificado a **320, 390, 768 y 1365 px**, sin desbordamiento
  horizontal. Se revisaron capturas de escritorio/móvil y se comprobó teclado
  Tab entre campos de identidad, etiquetas de inputs y conservación de títulos.
- LCOV combinado: **95,90 % de líneas y 89,96 % de ramas**, **98 fuentes**.
  Validador de inventario/integridad del workflow aprobado. Ambos componentes
  preparados tienen 100 % de líneas; FormularioCuenta 100 % de ramas y
  SelectorFotoPerfil 96,29 %. Son métricas locales, no aprobación remota de
  SonarCloud. No se modificaron sus umbrales, exclusiones ni configuración.
- Durante la validación se regeneraron los reportes después de modificar el
  runner QA para que la fusión use la misma versión. Un intento tuvo un error
  transitorio de Chrome CDP (`Invalid InterceptionId`); el recorrido final pasó
  completo sin cambiar la lógica de intercepción ni las reglas de cobertura.
- Rama conservada con los 19 archivos de esta corrección pendientes; sin
  commit, push, merge ni PR. El PR #29 sigue abierto como Draft, sin cambios.
