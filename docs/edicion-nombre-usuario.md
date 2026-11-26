# Corrección #3: edición de nombre de usuario

Rama `feature/edicion-nombre-usuario`, desde `origin/main` en
`306bb4f4aeaf5c21d3136594a6bd28c72e8b3016`. No incorpora los commits del
PR frontend #43 ni de filtros remotos.

## Contrato confirmado y dependencia

Backend PR #54, **pendiente de despliegue**. Única escritura de cuenta:

```http
PATCH /api/auth/me
Authorization: Bearer <token de la sesión vigente>
Content-Type: application/json

{"nombre":"Nuevo nombre"}
```

Respuesta: perfil plano como GET `/api/auth/me` (`id`, `nombre`, `dni`, `email`,
`rol`, `fechaRegistro`). Disponible para CLIENTE y PRESTADOR. Nombre obligatorio,
trim en backend y máximo 100 caracteres. El frontend también valida tras trim y
envía exclusivamente `nombre`; DNI, email, rol y fecha de alta permanecen intactos.
No utiliza el endpoint propuesto anteriormente `/api/usuarios/me` ni el PUT del
perfil profesional para modificar el nombre.

## Comportamiento

- «Editar nombre» en ambos perfiles reutiliza `FormularioCuenta`. Se puede
  cancelar sin petición. Durante el envío se bloquean los controles y los envíos
  duplicados; la edición profesional y la de nombre se abren por separado.
- Se reutilizan `apiRequest`, el JWT actual y el manejo de errores existente.
  HTTP 400, 403 y 500 muestran el error sin cambiar la sesión ni perder el
  borrador. HTTP 401 de la sesión vigente la invalida y requiere volver a entrar.
  Errores de red u otros HTTP tampoco anuncian guardado.
- Solo una respuesta válida con el mismo usuario, rol y datos protegidos y el
  nombre confirmado actualiza `AuthContext`, encabezado, iniciales y perfil.
  Se conserva el resto del usuario. Una respuesta incompleta o incompatible
  produce un error, aunque su HTTP sea 200.
- Un guardado confirmado invalida revalidaciones de sesión anteriores. El perfil
  profesional presenta el nombre de la sesión para evitar que un GET profesional
  tardío lo sustituya por el anterior.
- Logout, expiración o nuevo login invalidan la operación pendiente y reinician
  el editor, incluso al entrar otra vez con el mismo ID. Un 401 tardío de otro
  token no elimina la sesión nueva (protección existente del cliente HTTP).

No se cambia contraseña, fotos, fechas, solicitudes, mapa ni contratos del
directorio. No se escriben datos de perfil en almacenamiento local para simular
persistencia.

## Validación

`src/tests/EdicionNombreUsuario.test.jsx` usa AuthProvider, los perfiles reales,
el avatar y HTTP **simulado**. Cubre los dos roles, trim, límite, datos protegidos,
restauración de sesión, cancelación, doble envío, 400/401/403/500, respuestas
inválidas y carreras entre PATCH, GET y reemplazo de sesión. La restauración
comprueba el estado de la API simulada, no persistencia contra backend real.

Validación local con Node 26.13.0 (el proyecto declara 24.x):

- `npm.cmd run test:coverage`: 903 tests aprobados en 83 archivos; 39 casos nuevos.
- `npm.cmd run lint`: aprobado.
- `npm.cmd run build`: aprobado; advertencia de tamaño de chunk MapLibre >500 kB.
- Cobertura de la suite sin QA: 70,07 % líneas y 82,02 % ramas globales,
  incluyendo scripts de navegador que todavía no ejecuta esa suite.
- `npm.cmd run test:coverage:qa`: aprobado, siete ejecuciones con API simulada:
  navegador general (107 verificaciones), artefacto SPA (16 rutas), ayuda (55),
  cliente (50), prestador (67), lecturas HTTP del fixture y navegador público (65).
  Sin errores JavaScript en los recorridos; advertencias de estilos MapLibre por
  valores null. No se prueban escrituras contra el backend real.
- Cobertura fusionada de unitarias + QA: 96,13 % líneas y 90,18 % ramas globales.

La validación con Node 24 y CI queda pendiente de publicación autorizada.

## Antes de publicar o desplegar

1. Obtener autorización para publicar la rama; no se modifica el PR #43 ni el de filtros.
2. Coordinar despliegue del backend PR #54 y disponibilidad de PATCH en el origen
   de API elegido, con CORS y permisos CLIENTE/PRESTADOR.
3. Verificar con cuentas de prueba autorizadas la persistencia tras recargar,
   ambos roles, expiración y errores. Esta integración real sigue pendiente.
   Antes del despliegue backend, la petición puede fallar por ruta no disponible;
   la interfaz conserva los datos y no simula éxito.
4. Revisar CI/Sonar y Node 24. No hay resultados de Sonar para estos cambios locales.
