# Registro de defectos – Frontend ServiMap (F-26)

Responsable: Joaquim Oliveira
Fecha original: 26/10/2026. Estado revisado para la entrega: 29/10/2026.

Gravedad: Alta (impide usar una pantalla) · Media (afecta el uso) · Baja (detalle menor)

| ID | Descripción | Pantalla | Gravedad | Causa | Estado | Corrección |
|---|---|---|---|---|---|---|
| DEF-00 | El formulario de login aparecía junto con la búsqueda de prestadores | /login | Media | App.jsx mostraba las rutas y la pantalla principal al mismo tiempo | ✅ Corregido (Oriana Ferrari) | La búsqueda solo se muestra en la página de inicio |
| DEF-01 | El login se ve roto: título, texto, formulario y enlace aparecen uno al lado del otro y se salen de la pantalla en celular | /login | Alta | Faltaba el contenedor `.login-tarjeta`, que tenía estilos en Login.css pero no existía en el JSX | ✅ Corregido | Se agregó el `<div className="login-tarjeta">` en Login.jsx |
| DEF-02 | El formulario de registro se sale 9px de la pantalla en celulares de 320px | /registro | Media | `width: 100%` más `padding: 30px` hacía el formulario más ancho que la pantalla | ✅ Corregido | Se agregó `box-sizing: border-box` en Registro.css |
| DEF-03 | La página "Página no encontrada" no tiene forma de volver al inicio | Cualquier URL inexistente | Baja | La ruta `*` mostraba solo un título | ✅ Corregido | Nueva página PaginaNoEncontrada con enlace "Volver al inicio" |
| DEF-04 | Con un precio máximo negativo aparecen 0 prestadores sin explicar por qué | Inicio (filtros) | Baja | No había validación visible del precio | ✅ Corregido | Mensaje "El precio máximo no puede ser negativo." |
| DEF-05 | El login muestra "El servicio de autenticación todavía no está configurado." | /login | Media | Faltaba configurar `VITE_API_URL` | ✅ Configuración corregida | URL pública configurada, servicios conectados y GET reales verificados. El login con credenciales reales sigue pendiente; ver entrega final. |
| DEF-06 | `npm audit` informa 3 dependencias con severidad alta | Herramientas de desarrollo | Media | Vite 8.3.2, undici 8.11.2 (jsdom) y zod 4.6.5 (eslint-plugin-react-hooks) | ⏳ Abierto, confirmado el 29/10 | Son dependencias de desarrollo según `npm explain`; falta aplicar parches y validar. No se reprodujo explotación ni se certifica ausencia de vulnerabilidades en producción. |

**Resumen:** 7 defectos registrados · 6 corregidos · 1 abierto. Las brechas de requisitos y los bloqueos de publicación se detallan en [entrega final](entrega-final.md).

Los defectos DEF-01, DEF-03 y DEF-04 tienen tests automáticos en `src/tests/CorreccionesF26.test.jsx`. El DEF-02 se verificó a mano (caso de prueba CP-18), porque el entorno de tests no mide el ancho real de la pantalla.
