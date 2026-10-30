// Recorrido QA contra prestador-demo.mjs en localhost; nunca usa el backend publicado.
import { ejecutarRecorridoDemo } from './runner-demo.mjs'

await ejecutarRecorridoDemo({ nombre: 'prestador', apiOrigin: 'http://127.0.0.1:4193', url: 'http://127.0.0.1:4192/prestador', recorrido: async ({ ev, until, check, go, click, fill, capture, screens, wait }) => {
  await until('!!document.querySelector(".panel-prestador-indicadores")','Panel listo');
  check(await ev('!!document.getElementById("qa-prestador-aviso")'),'Aviso QA');
  check(await ev('!!document.querySelector("meta[http-equiv=Content-Security-Policy]")'),'CSP exclusiva QA');
  check(await ev('!localStorage.length'),'Sin credenciales en localStorage');
  const escenario=await ev('document.getElementById("qa-prestador-aviso").textContent.split(".")[0]');
  await screens('panel');
  await click('Ir a mi perfil');
  await until('!!document.querySelector("main dl")','Mi perfil');
  await screens('perfil');
  await click('Editar perfil');await until('!!document.getElementById("precioMin")','Edicion');
  await screens('edicion');
  if(escenario.includes('completo')&&!escenario.includes('incompleto')){
   await fill('zonaCobertura','QA cambio cancelado');await click('Cancelar');
   check(await ev('!document.querySelector("main").textContent.includes("QA cambio cancelado")'),'Cancelar perfil');
   await click('Editar perfil');await fill('precioMin','50000');await click('Guardar cambios');
   await until('!!document.querySelector("main [role=alert]")','Validacion precios');check(true,'Rango precios invalido rechazado');
   await fill('precioMin','15000');await fill('zonaCobertura','Cordoba Capital - Zona QA editada');
   await fill('latitud','-31.418123');await fill('longitud','-64.184321');
   await click('Guardar cambios');await until('document.querySelector("main").textContent.includes("Perfil actualizado en el servidor.")','Perfil guardado');check(true,'Perfil, precios y ubicacion guardados en memoria');
   await capture('perfil-guardado');
   await click('Editar perfil');await ev('document.querySelector("form input[type=checkbox]").click()');await click('Guardar cambios');
   await until('!!document.querySelector("main dl")','Disponibilidad guardada');check(await ev('document.querySelector("main").textContent.includes("No disponible")'),'Disponibilidad modificada');
   await click('Editar perfil');await ev('document.querySelector("form input[type=checkbox]").click()');await click('Guardar cambios');await until('!!document.querySelector("main dl")','Disponible');
  }
  await click('Mis oficios');await until('document.getElementById("nuevo-oficio")?.disabled===false','Oficios');
  await screens('oficios');
  if(escenario.includes('completo')&&!escenario.includes('incompleto')){
   await fill('nuevo-oficio','00000000-0000-4000-8000-000000000203');await click('Agregar oficio');await click('Guardar oficios');
   await until('document.querySelector("main").textContent.includes("Oficios guardados en el servidor.")','Oficios guardados');check(await ev(`!!document.querySelector('button[aria-label="Quitar Pintura"]')`),'Agregar oficio');
   await click('Quitar Pintura');await click('Guardar oficios');await until('document.querySelector("main").textContent.includes("Oficios guardados en el servidor.")','Quitar guardado');check(await ev(`!document.querySelector('button[aria-label="Quitar Pintura"]')`),'Quitar oficio');
  }
  await go('/prestador','!!document.querySelector(".panel-prestador-indicadores")');await click('Ver solicitudes');
  await until('!document.body.textContent.includes("Cargando solicitudes recibidas...") && !!document.querySelector(".solicitudes-prestador")','Solicitudes');
  await screens('solicitudes');
  if(escenario.includes('completo')&&!escenario.includes('incompleto')){
   const card='[...document.querySelectorAll(".solicitudes-prestador-tarjeta")].find(e=>e.textContent.includes("00000000-0000-4000-8000-000000000601"))';
   await click('Ver detalle',card);await screens('solicitud-detalle');await click('Cerrar detalle');
   await click('Aceptar solicitud',card);await capture('solicitud-confirmacion');
   await click('Volver',card);check(await ev('!document.querySelector(".solicitudes-prestador-confirmacion")'),'Cancelar confirmacion');
   await click('Aceptar solicitud',card);await click('Confirmar aceptación',card);
   await until(card+'.querySelector("[data-estado]").dataset.estado==="ACEPTADA"','Aceptada');check(true,'Aceptar solicitud');
   await click('Marcar trabajo como terminado',card);await click('Confirmar trabajo terminado',card);
   await until(card+'.querySelector("[data-estado]").dataset.estado==="FINALIZADA"','Finalizada');check(true,'Finalizar solicitud');
   const other=card.replaceAll('000000000601','000000000602');
   await click('Rechazar solicitud',other);await click('Confirmar rechazo',other);
   await until(other+'.querySelector("[data-estado]").dataset.estado==="RECHAZADA"','Rechazada');check(true,'Rechazar solicitud');
   await capture('solicitudes-actualizadas');
  }
  await click('Explorar servicios');await until('!!document.querySelector(".tarjeta-prestador")','Directorio');
  await wait(2500);await screens('directorio');
  await ev('document.querySelector(".boton-nombre").click()');await until('!!document.querySelector(".detalle")','Ficha publica');
  await screens('perfil-publico');
  await go('/','!!document.querySelector(".inicio-landing")');await screens('landing');
  await go('/registro','!!document.querySelector(".registro-pagina")');await screens('registro');
  await go('/login','!!document.querySelector(".login-pagina")');await screens('login');
  for(const route of ['/cliente','/cliente/solicitudes','/admin']){
   await go(route,'location.pathname==="/acceso-denegado"');check(true,route+' protegido por rol');
  }
  await go('/prestador','!!document.querySelector(".panel-prestador-indicadores")');
  return escenario
} })
