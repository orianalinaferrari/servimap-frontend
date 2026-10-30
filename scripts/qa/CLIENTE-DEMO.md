# Demo local CLIENTE

Con Node 24 y dependencias instaladas, ejecutar desde la raíz:

```powershell
node scripts/qa/cliente-demo.mjs
```

Abrir **http://127.0.0.1:4194/cliente**. API simulada en
`http://127.0.0.1:4195`; todos los cambios viven exclusivamente en memoria.
La sesión ficticia se prepara automáticamente, sin credenciales reales.
No se modifican `.env`, el backend, los servicios ni la autenticación productiva.
La demo restringe las conexiones mediante CSP y no reenvía tráfico.

| Vista | Funciones existentes |
| --- | --- |
| `/cliente` | Accesos a búsqueda y solicitudes. No existe un resumen numérico ni perfil personal del cliente. |
| `/cliente/solicitudes` | Historial, detalle, cancelación de pendientes/aceptadas y calificación única de finalizadas. |
| `/prestadores` | Directorio aprobado. La creación de solicitudes se abre desde la ficha con «Solicitar servicio». |

No se agregan rutas, endpoints, propuestas ni presupuestos. El formulario de
creación conserva todos sus campos y validaciones. El directorio y las fichas
mantienen su diseño; solo el formulario abierto por un cliente usa los nuevos estilos.

Con **una sola demo** activa, ejecutar el recorrido con Chrome instalado:

```powershell
node scripts/qa/cliente-navegador.mjs
```

Comprueba navegación, cinco estados, creación, cancelación, calificación,
persistencia en memoria tras recarga, ausencia de duplicados y permisos.
Genera PNG de las vistas principales a 1365, 768, 390 y 320 px, comprueba
desbordamientos y escribe `resultado.json` en la carpeta temporal que imprime.
Bloquea el backend publicado y comprueba que no hubo conexiones hacia él.
Los informes omiten tokens. El navegador se cierra al finalizar.

El recorrido consume los datos iniciales: detener la demo con Ctrl+C y reiniciarla
antes de repetirlo. Para verificar otros escenarios, detener primero la instancia
anterior y usar **uno** de estos comandos, seguido del mismo recorrido:

```powershell
node scripts/qa/cliente-demo.mjs --escenario=errores
node scripts/qa/cliente-demo.mjs --escenario=vacio
```

`errores` falla una vez al crear, cancelar y calificar; permite reintentar sin perder
datos del formulario. `vacio` presenta el historial sin pedidos ni reseñas.
No ejecutar demos, navegadores ni suites pesadas simultáneamente.
Para la suite completa con un único worker:

```powershell
npm.cmd test -- --maxWorkers=1
npm.cmd run lint
npm.cmd run build
git diff --check
```
