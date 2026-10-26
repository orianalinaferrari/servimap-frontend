# Registro de defectos – Frontend ServiMap (F-26)

Responsable: Joaquim Oliveira
Fecha: 26/10/2026

Gravedad: Alta (impide usar una pantalla) · Media (afecta el uso) · Baja (detalle menor)

| ID | Descripción | Pantalla | Gravedad | Causa | Estado | Corrección |
|---|---|---|---|---|---|---|
| DEF-00 | El formulario de login aparecía junto con la búsqueda de prestadores | /login | Media | App.jsx mostraba las rutas y la pantalla principal al mismo tiempo | ✅ Corregido (Oriana Ferrari) | La búsqueda solo se muestra en la página de inicio |
| DEF-01 | El login se ve roto: título, texto, formulario y enlace aparecen uno al lado del otro y se salen de la pantalla en celular | /login | Alta | Faltaba el contenedor `.login-tarjeta`, que tenía estilos en Login.css pero no existía en el JSX | ✅ Corregido | Se agregó el `<div className="login-tarjeta">` en Login.jsx |
| DEF-02 | El formulario de registro se sale 9px de la pantalla en celulares de 320px | /registro | Media | `width: 100%` más `padding: 30px` hacía el formulario más ancho que la pantalla | ✅ Corregido | Se agregó `box-sizing: border-box` en Registro.css |
| DEF-03 | La página "Página no encontrada" no tiene forma de volver al inicio | Cualquier URL inexistente | Baja | La ruta `*` mostraba solo un título | ✅ Corregido | Nueva página PaginaNoEncontrada con enlace "Volver al inicio" |
| DEF-04 | Con un precio máximo negativo aparecen 0 prestadores sin explicar por qué | Inicio (filtros) | Baja | No había validación visible del precio | ✅ Corregido | Mensaje "El precio máximo no puede ser negativo." |
| DEF-05 | El login muestra "El servicio de autenticación todavía no está configurado." | /login | Media | Falta el archivo `.env` con `VITE_API_URL` apuntando al backend | ⏳ Abierto | Configurar `VITE_API_URL` al conectar el backend (avisado al equipo) |
| DEF-06 | `npm install` informa 3 vulnerabilidades de severidad alta en dependencias | Proyecto | Media | Versiones de librerías de terceros | ⏳ Abierto | Revisar con `npm audit` en equipo antes de actualizar, para no romper la app |

**Resumen:** 7 defectos registrados · 5 corregidos · 2 abiertos

Los defectos DEF-01, DEF-03 y DEF-04 tienen tests automáticos en `src/tests/CorreccionesF26.test.jsx`. El DEF-02 se verificó a mano (caso de prueba CP-18), porque el entorno de tests no mide el ancho real de la pantalla.