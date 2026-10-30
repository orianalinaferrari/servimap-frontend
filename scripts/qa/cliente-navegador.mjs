// Recorrido QA contra cliente-demo.mjs en localhost; nunca usa el backend publicado.
import { ejecutarRecorridoDemo } from './runner-demo.mjs'

await ejecutarRecorridoDemo({ nombre: 'cliente', apiOrigin: 'http://127.0.0.1:4195', url: 'http://127.0.0.1:4194/cliente', recorrido: async ({ cdp, ev, until, check, go, click, fill, capture, screens }) => {
  await until('!!document.querySelector(".cliente-accesos")','Panel listo');
  check(await ev('!!document.getElementById("qa-cliente-aviso")'),'Aviso QA');
  check(await ev('!!document.querySelector("meta[http-equiv=Content-Security-Policy]")'),'CSP exclusiva QA');
  check(await ev('!localStorage.length'),'Sin credenciales en localStorage');
  const escenario=await ev('document.getElementById("qa-cliente-aviso").textContent.split(".")[0]');
  const vacio=escenario.includes('vacio'),conErrores=escenario.includes('errores');
  await screens('panel');
  check(await ev('document.querySelectorAll(".cliente-header nav a.active").length===1'),'Solo panel activo');
  check(await ev('[...document.querySelectorAll(".cliente-header nav a")].every(a=>getComputedStyle(a).textDecorationLine==="none")'),'Header sin subrayados');
  await click('Mis solicitudes');
  await until('!!document.querySelector(".solicitudes-cliente") && !document.body.textContent.includes("Cargando solicitudes...")','Solicitudes listas');
  check(await ev('document.querySelector(".cliente-header nav a.active").getAttribute("href")==="/cliente/solicitudes"'),'Solo solicitudes activa');
  await screens('solicitudes');
  const card=id=>'[...document.querySelectorAll(".solicitudes-cliente-tarjeta")].find(e=>e.textContent.includes("00000000-0000-4000-8000-000000000'+id+'"))';
  if(vacio){
    check(await ev('!!document.querySelector(".solicitudes-cliente-vacio")'),'Estado vacio conservado');
  }else{
    check(await ev('new Set([...document.querySelectorAll(".solicitudes-cliente-estado [data-estado]")].map(e=>e.dataset.estado)).size===5'),'Cinco estados reales');
    await click('Ver detalle',card(601));await screens('detalle');await click('Cerrar detalle',card(601));
    await click('Preparar cancelación',card(601));await screens('cancelacion');
    await click('Volver',card(601));check(await ev('!document.querySelector(".solicitudes-cliente-confirmacion")'),'Volver conserva la solicitud');
    await click('Preparar cancelación',card(601));await click('Confirmar cancelación',card(601));
    if(conErrores){
      await until('!!document.querySelector("main [role=alert]")','Error de cancelacion visible');await capture('error-cancelacion');
      await click('Confirmar cancelación',card(601));
    }
    await until(card(601)+'.querySelector("[data-estado]").dataset.estado==="CANCELADA"','Cancelada');
    check(await ev(card(601)+'.querySelectorAll(".solicitudes-cliente-cancelar").length===0'),'Cancelada sin acciones incompatibles');
    check(await ev(card(603)+'.querySelectorAll(".solicitudes-cliente-cancelar").length===1'),'Aceptada conserva la cancelacion permitida');
    await click('Calificar prestador',card(604));await screens('calificacion');
    await click('Enviar calificación',card(604));await until('!!document.querySelector(".calificar-prestador [role=alert]")','Puntaje obligatorio');
    check(true,'Validacion de puntaje conservada');
    await ev('document.querySelector(".calificar-prestador input[value=\\"5\\"]").click()');
    await fill('comentario-00000000-0000-4000-8000-000000000604','QA: servicio puntual. Comentario ficticio.');
    await click('Enviar calificación',card(604));
    if(conErrores){
      await until('!!document.querySelector("main > [role=alert]")','Error de calificacion visible');await capture('error-calificacion');
      await click('Enviar calificación',card(604));
    }
    await until('document.querySelector("main").textContent.includes("La calificación fue registrada correctamente.")','Calificacion guardada');
    check(await ev(card(604)+'.querySelectorAll(".cliente-calificacion-registrada svg").length===5'),'Calificacion con estrellas SVG');
    await screens('calificacion-registrada');
    // La marca desaparece solo cuando el documento realmente se recargó.
    await ev('window.qaAntesDeRecargar=true');await cdp('Page.reload');await until('!window.qaAntesDeRecargar && !!'+card(604),'Historial recargado');
    check(await ev('![...'+card(604)+'.querySelectorAll("button")].some(e=>e.textContent.includes("Calificar prestador"))'),'Sin calificacion duplicada tras recarga');
  }
  await go('/prestadores','!!document.querySelector(".tarjeta-prestador")');
  if(!vacio){
    await ev('[...document.querySelectorAll(".boton-nombre")].find(e=>e.getAttribute("aria-label").includes("Pintura")).click()');
    await until('!!document.querySelector(".detalle")','Ficha lista');await click('Solicitar servicio');
    await until('!!document.querySelector(".cliente-formulario-solicitud")','Crear solicitud');
    await screens('crear-solicitud');
    await click('Enviar solicitud');check(await ev('!!document.querySelector("[aria-invalid=true]")'),'Validacion de creacion');
    await fill('solicitud-servicio','Pintura');await fill('solicitud-descripcion','QA: pintar comedor. Solicitud completamente ficticia.');
    await fill('solicitud-direccion','Domicilio ficticio QA 20');await fill('solicitud-contacto','cliente@example.test');
    await click('Enviar solicitud');
    if(conErrores){
      await until('!!document.querySelector(".crear-solicitud [role=alert]")','Error de creacion visible');await capture('error-creacion');
      await click('Enviar solicitud');
    }
    await until('document.body.textContent.includes("Tu solicitud fue enviada correctamente.")','Solicitud creada');check(true,'Crear solicitud sin coordenadas con API simulada');
    await capture('solicitud-enviada');await click('Volver al prestador');await until('!!document.querySelector(".detalle")','Volver conserva ficha');
    await go('/cliente/solicitudes','!!document.querySelector(".solicitudes-cliente-tarjeta")');
    check(await ev('document.querySelector(".solicitudes-cliente-tarjeta").textContent.includes("Pintura")'),'Nueva solicitud en historial');
  }
  for(const route of ['/prestador','/prestador/perfil','/admin']){
    await go(route,'location.pathname==="/acceso-denegado"');check(true,route+' protegido por rol');
  }
  await go('/cliente','!!document.querySelector(".cliente-accesos")');
  return escenario
} })
