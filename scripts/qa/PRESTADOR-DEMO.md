# Demo local PRESTADOR

Desde la raíz del repositorio, con Node 24 y las dependencias instaladas:

```powershell
node scripts/qa/prestador-demo.mjs
```

Abrir **http://127.0.0.1:4192/prestador** (usar exactamente esa dirección).
API ficticia en `http://127.0.0.1:4193`. No requiere credenciales.
Detener con Ctrl+C y repetir el comando para reiniciar todos los datos.

Otros escenarios, deteniendo primero la instancia anterior:

```powershell
node scripts/qa/prestador-demo.mjs --escenario=incompleto
node scripts/qa/prestador-demo.mjs --escenario=vacio
```

`completo` incluye siete solicitudes en cinco estados, dos reseñas, precios,
contactos ficticios y coordenadas. `incompleto` permite completar el perfil desde
cero, sin oficios, ubicación, reseñas ni pedidos. `vacio` conserva el perfil completo
pero no tiene actividad ni calificaciones. Ninguna variante añade rutas del producto.

| Ruta | Funciones existentes |
| --- | --- |
| `/prestador` | Resumen, actividad reciente, actualizar y accesos rápidos. |
| `/prestador/perfil` | Perfil propio, edición, contactos, precios, disponibilidad, coordenadas privadas y reseñas. |
| `/prestador/oficios` | Agregar/quitar oficios activos y guardar asociaciones. |
| `/prestador/solicitudes` | Detalle, confirmación, aceptar, rechazar y finalizar; consultar estados históricos. |
| `/prestadores` | Directorio, filtros, mapa y ficha pública al pulsar «Ver perfil». |
| `/` | Landing existente; regresar con los enlaces del navegador o las rutas anteriores. |

No existe una URL independiente para la ficha pública ni para editar el perfil:
son estados de las pantallas existentes. Nombre/email de cuenta son de solo lectura.
La foto se configura mediante URL, sin carga de archivos. Los campos numéricos
vacíos conservan valores anteriores. Las reglas existentes impiden borrar algunos
contactos guardados. No se agregan cancelación de solicitudes por el prestador,
calificaciones propias ni acciones de cliente o administrador.

## Aislamiento y verificación

Se reutiliza `api-simulada.mjs`: JWT sintético con firma inválida en producción,
sesión temporal de pestaña, permisos reales del frontend y estado en memoria.
No se cambia `src/`, el cliente HTTP, `.env` ni el backend. La API no reenvía peticiones;
valida Host/Origin y solo escucha en loopback. Una CSP exclusiva de la demo limita
conexiones a localhost y a la cartografía de OpenFreeMap. No utilizar contactos ni
credenciales reales. Las teselas son lecturas externas; los contactos ficticios no
deben usarse para llamar o enviar mensajes.

Con la demo iniciada y Chrome instalado en Windows:

```powershell
node scripts/qa/prestador-navegador.mjs
```

El recorrido verifica escritorio (1365), tablet (768) y móvil (390 y 320), incluye capturas de landing, registro y login, protege rutas
de otros roles y bloquea el backend publicado. En el escenario completo también
prueba formularios, cancelación, validación de precios, oficios y transiciones.
Modifica exclusivamente la memoria de la demo: reiniciarla antes de repetirlo.
Imprime la carpeta temporal de capturas PNG y `resultado.json`; no guarda el token
en esos informes. Para escenarios vacíos/incompletos, reiniciar con la opción
correspondiente y repetir el mismo recorrido.
