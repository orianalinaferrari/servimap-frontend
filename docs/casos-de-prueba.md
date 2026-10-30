# Casos de prueba – Frontend ServiMap (F-26)

> Evidencia histórica del prototipo del 26/10; sus nombres y cantidades son fixtures, no datos actuales de la API. La aceptación vigente y sus límites están en [entrega final](entrega-final.md).

Responsable: Joaquim Oliveira
Fecha de ejecución: 26/10/2026
Entorno: navegador Chrome, `npm run dev` (http://localhost:5173), sin backend conectado (datos mock)

Resultado: ✅ Pasa · ❌ Falla

| ID | Funcionalidad | Pasos | Resultado esperado | Resultado |
|---|---|---|---|---|
| CP-01 | Búsqueda por oficio | Escribir "plom" en "Buscar prestador" | Aparecen Carlos Gómez y Martín Rodríguez | ✅ |
| CP-02 | Búsqueda sin acentos | Escribir "nunez" | Aparecen Lucía Fernández y Valeria Núñez | ✅ |
| CP-03 | Búsqueda sin resultados | Escribir "xyz" | Mensaje "No se encontraron prestadores con los criterios seleccionados." | ✅ |
| CP-04 | Filtro por calificación | Elegir "4,5 estrellas o más" | Aparecen Carlos Gómez, Lucía Fernández y Diego Álvarez | ✅ |
| CP-05 | Filtro solo disponibles | Marcar "Solo prestadores disponibles" | Aparecen 6 prestadores (no aparece Martín Rodríguez) | ✅ |
| CP-06 | Limpiar filtros | Aplicar filtros y hacer clic en "Limpiar filtros" | Vuelven a aparecer los 7 prestadores | ✅ |
| CP-07 | Precio máximo negativo | Escribir "-5000" en "Precio máximo" | Mensaje "El precio máximo no puede ser negativo." (DEF-04) | ✅ |
| CP-08 | Detalle del prestador | Hacer clic en "Carlos Gómez" | Se ve la ficha con datos, reputación, 2 comentarios y contacto | ✅ |
| CP-09 | Volver conserva la búsqueda | Filtrar por zona, abrir un prestador y hacer clic en "Volver" | La lista vuelve con el mismo filtro | ✅ |
| CP-10 | Prestador no disponible | Abrir "Martín Rodríguez" | Dice "No disponible" en rojo y "Solicitar servicio" está deshabilitado | ✅ |
| CP-11 | Prestador sin calificaciones | Abrir "Javier López" | Dice "Sin calificaciones" y "Todavía no hay comentarios" | ✅ |
| CP-12 | Ruta protegida sin sesión | Entrar a http://localhost:5173/admin | Redirige a la página de inicio de sesión | ✅ |
| CP-13 | Validación del login | En /login, hacer clic en "Iniciar sesión" sin completar | Mensajes "El email es obligatorio" y "La contraseña es obligatoria" | ✅ |
| CP-14 | Validación del registro | En /registro, hacer clic en "Crear cuenta" sin completar | Aparece un mensaje de error en cada campo obligatorio | ✅ |
| CP-15 | Página no encontrada | Entrar a http://localhost:5173/abc | Mensaje "Página no encontrada" y enlace "Volver al inicio" (DEF-03) | ✅ |
| CP-16 | Responsive: inicio | Ver el inicio en modo celular (iPhone SE) y en computadora | 1 columna de tarjetas en celular, 3 en computadora, sin barra horizontal | ✅ |
| CP-17 | Responsive: login | Ver /login en modo celular | Formulario dentro de una tarjeta, sin salirse de la pantalla (DEF-01) | ✅ |
| CP-18 | Responsive: registro | Ver /registro en un celular de 320px de ancho | El formulario no se sale de la pantalla (DEF-02) | ✅ |

**Resumen:** 18 casos ejecutados · 18 pasan · 0 fallan

## Pruebas automáticas

Además de estas pruebas manuales, se ejecutaron **322 tests automáticos** (Vitest + Testing Library) al integrar temporalmente F-26 con la rama `develop`. Los 322 tests pasaron correctamente.
La moderación de comentarios y el panel de administración necesitan una sesión de Administrador, así que se prueban con tests automáticos (`ModeracionComentarios.test.jsx`, `PanelAdministracion.test.jsx`) hasta que el backend esté conectado.
