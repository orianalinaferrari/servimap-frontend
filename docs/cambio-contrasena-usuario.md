# Corrección #8: cambio de contraseña

Rama independiente `feature/cambio-contrasena-usuario`, desde `origin/main` en
`306bb4f4aeaf5c21d3136594a6bd28c72e8b3016`. No incorpora paginación, filtros,
edición de nombre ni Centro de ayuda.

## Contrato confirmado

Backend PR #54, **pendiente de despliegue**:

```http
PATCH /api/auth/me/password
Authorization: Bearer <JWT vigente>
Content-Type: application/json

{"passwordActual":"<actual>","passwordNueva":"<nueva>"}
```

Respuesta exitosa: `{"mensaje":"Contraseña actualizada"}`. El frontend solo
acepta ese mensaje confirmado; no representa como éxito respuestas vacías,
envoltorios o mensajes distintos. No muestra cuerpos arbitrarios del servidor.

El backend responde 400 si falta un campo, la nueva tiene menos de ocho caracteres,
es igual a la actual o la actual es incorrecta. El frontend valida los tres
primeros casos y exige confirmación coincidente; la contraseña actual se verifica
exclusivamente en backend. No aplica trim ni modifica espacios, no impone otras
reglas y no envía la confirmación.

## Cuenta, errores y datos sensibles

- Sección «Seguridad de la cuenta» en los perfiles de CLIENTE y PRESTADOR,
  reutilizando estilos responsivos existentes y el cliente HTTP/autenticación.
- Tres inputs `type=password`, etiquetas asociadas, campos obligatorios,
  `current-password`/`new-password`, ayuda accesible, foco al abrir y retorno al
  cerrar. No incluye control para revelar contraseñas.
- Controles deshabilitados y bloqueo síncrono durante el envío. Los campos se
  limpian al confirmar éxito, cancelar, desmontar el formulario o reemplazar sesión.
- Los valores se leen del formulario al enviar; no se guardan en AuthContext,
  localStorage, sessionStorage, URL, logs ni analytics. Solo se envían por el
  cuerpo JSON de la petición autenticada. El navegador puede ofrecer su propio
  gestor de contraseñas según la preferencia del usuario.
- HTTP 400 muestra una indicación sobre contraseña actual correcta y nueva válida;
  401 vigente expira la sesión mediante el mecanismo existente; 403 conserva
  sesión e informa falta de permiso; 500 permite reintentar. Se manejan también
  409 como conflicto y 404 como operación no disponible **si el servidor los
  devuelve**; no se presentan como errores de negocio confirmados del PR #54.
  Errores de red, respuestas malformadas y otros fallos nunca anuncian éxito.
- Se conserva el código HTTP, pero se usan mensajes propios sin reflejar posibles
  datos sensibles recibidos en errores. Un rechazo no modifica usuario ni perfil.
- Guardado limitado a la versión y token de sesión que lo inició. La interfaz
  descarta resultados después de cambiar de sesión; un 401 de un token anterior
  no elimina el token nuevo, conforme al cliente HTTP existente. Descartar una
  respuesta no garantiza que el backend no haya procesado ya el cambio.
- **El backend no revoca JWT después del cambio.** Se conserva la sesión actual,
  no se promete cerrar otras sesiones ni se implementa revocación ficticia.

## Validación local

Las pruebas usan exclusivamente API simulada; no acreditan integración real:

- `npm.cmd test -- src/tests/CambioContrasena.test.jsx`: 57 casos nuevos para los
  dos roles, contrato, validación, errores, limpieza, privacidad, duplicados y
  carreras de sesión.
- `node src/tests/qa-cambio-contrasena.mjs`: Chrome local, 13 verificaciones por
  rol, con tamaños 1365, 768, 390 y 320 px sin desbordamiento horizontal. Comprueba
  etiquetas, teclado, foco, inputs enmascarados, éxito, limpieza y almacenamiento
  limitado al JWT. Verificación visual adicional de la captura móvil de cliente.
- `npm.cmd run test:coverage`: 921 tests aprobados en 83 archivos, incluidos los
  57 nuevos. Cobertura global sin recorridos QA: 70,27 % líneas y 81,96 % ramas
  (incluye scripts de navegador sin ejecutar por las unitarias).
- `npm.cmd run lint`: aprobado.
- `npm.cmd run build`: aprobado, con advertencia de tamaño de chunk MapLibre >500 kB.
- `npm.cmd run test:coverage:qa`: siete recorridos de regresión aprobados con API
  simulada: general (107 verificaciones), artefacto SPA (16 rutas), ayuda (55),
  cliente (50), prestador (67), lecturas HTTP del fixture y navegador público (65).
  Sin errores JavaScript; advertencias de estilos MapLibre por valores null.
  Cobertura fusionada global: **96,16 % líneas y 90,15 % ramas**. El recorrido
  específico de contraseña se ejecutó por separado y no se sumó a esta cobertura.

Node disponible: 26.13.0; el proyecto declara 24.x. No se instalan dependencias
ni se cambia la configuración para esta corrección.

## Pendientes antes de publicar y desplegar

1. Autorización para publicar la rama y crear PR. CI/Node 24 y Sonar pendientes.
2. Coordinar despliegue de backend PR #54 y CORS de PATCH en el origen elegido.
3. Integración real autorizada para ambos roles: contraseña actual incorrecta,
   cambio exitoso, acceso con nueva contraseña y comportamiento de sesiones.
4. Un error de red o respuesta inválida puede ocurrir después de persistir el
   cambio en backend; el frontend no anuncia éxito y recomienda verificar acceso.

No modifica otros datos personales, otras ramas, backend, fotos, mapa, fechas,
solicitudes ni Centro de ayuda. No publica ni despliega.
