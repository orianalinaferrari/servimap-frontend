// Recorrido QA contra cliente-demo.mjs en localhost; nunca usa el backend publicado.
import{spawn}from'node:child_process';import{mkdtempSync,existsSync,readFileSync,writeFileSync,rmSync}from'node:fs';import os from'node:os';import path from'node:path';import assert from'node:assert/strict';
const folder=mkdtempSync(path.join(os.tmpdir(),'servimap-cliente-')),profile=path.join(folder,'perfil'),wait=ms=>new Promise(r=>setTimeout(r,ms));let ws,seq=0,blocked=0;const pending=new Map(),results=[],errors=[],requests=[];
const chrome=spawn(String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`,['--headless=new','--remote-debugging-port=0','--user-data-dir='+profile,'--disk-cache-size=1048576','--no-first-run','--disable-extensions','--disable-background-networking','--disable-sync','about:blank'],{windowsHide:true,stdio:'ignore',shell:false,env:{...process.env,PATH:String.raw`C:\Windows\System32`}});
function cdp(method,params={}){return new Promise((r,j)=>{const id=++seq,t=setTimeout(()=>j(Error(method+' timeout')),30000);pending.set(id,{r:x=>{clearTimeout(t);r(x)},j});ws.send(JSON.stringify({id,method,params}))})}async function ev(expression){const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true}).catch(e=>{throw Error(expression.slice(0,90)+': '+e.message)});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value}
async function shot(name,width,height){const s=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height,scale:1}});writeFileSync(path.join(folder,name+'.png'),Buffer.from(s.data,'base64'))}
try{const active=path.join(profile,'DevToolsActivePort');for(let i=0;i<100&&!existsSync(active);i++)await wait(100);assert.ok(existsSync(active));const port=readFileSync(active,'utf8').split(/\r?\n/)[0],tabs=await fetch('http://127.0.0.1:'+port+'/json/list').then(r=>r.json());ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});ws.onmessage=({data})=>{const m=JSON.parse(data),p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.j(Error(m.error.message)):p.r(m.result)}else if(m.method==='Fetch.requestPaused'){blocked++;cdp('Fetch.failRequest',{requestId:m.params.requestId,errorReason:'BlockedByClient'}).catch(()=>{})}else if(m.method==='Network.requestWillBeSent'){const u=new URL(m.params.request.url);if(u.origin==='http://127.0.0.1:4195')requests.push({method:m.params.request.method,path:u.pathname})}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text)};await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Fetch.enable',{patterns:[{urlPattern:'https://servimap-backend.vercel.app/*',requestStage:'Request'}]});


async function until(expression,name){for(let i=0;i<200;i++){if(await ev(expression))return;await wait(100)}throw Error(name)}
function check(value,name){assert.ok(value,name);results.push(name)}
async function go(route,condition){await ev('history.pushState(null,"",'+JSON.stringify(route)+');dispatchEvent(new PopStateEvent("popstate"))');await until(condition,route);await ev('document.fonts.ready.then(()=>true)')}
async function click(name,scope='document'){await ev('(()=>{const e=[...'+scope+'.querySelectorAll("button,a")].find(e=>(e.getAttribute("aria-label")||e.textContent).trim()==='+JSON.stringify(name)+'&&!e.disabled);if(!e)throw Error("Control ausente: "+'+JSON.stringify(name)+');e.click()})()');await wait(100)}
async function fill(id,value){await ev('(()=>{const e=document.getElementById('+JSON.stringify(id)+');const proto=e.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:e.tagName==="SELECT"?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,"value").set.call(e,'+JSON.stringify(value)+');e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}))})()')}
async function capture(name){const size=await ev('({width:innerWidth,height:document.documentElement.scrollHeight})');await shot(name,size.width,size.height)}
async function screens(name){for(const width of [1365,768,390,320]){await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<=390});await ev('scrollTo(0,0)');await wait(200);const fits=await ev('document.documentElement.scrollWidth<=innerWidth');check(fits,name+' sin overflow '+width);await capture(name+'-'+width)}await cdp('Emulation.setDeviceMetricsOverride',{width:1365,height:900,deviceScaleFactor:1,mobile:false})}

await cdp('Network.enable');
await cdp('Emulation.setDeviceMetricsOverride',{width:1365,height:900,deviceScaleFactor:1,mobile:false});
await cdp('Page.navigate',{url:'http://127.0.0.1:4194/cliente'});
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
  await cdp('Page.reload');await until('!!document.querySelector(".solicitudes-cliente-tarjeta")','Historial recargado');
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
check(blocked===0,'Ninguna conexion al backend publicado');
check(requests.every(r=>r.path.startsWith('/api/')),'Solo contratos API existentes');
assert.equal(errors.length,0);
writeFileSync(path.join(folder,'resultado.json'),JSON.stringify({aprobado:true,escenario,results,requests,blocked,errors},null,2));
console.log(JSON.stringify({aprobado:true,escenario,checks:results.length,folder,blocked,errors}));
}catch(error){
 writeFileSync(path.join(folder,'resultado.json'),JSON.stringify({aprobado:false,error:error.message,results,requests,errors,folder},null,2));
 console.error(JSON.stringify({aprobado:false,error:error.message,folder}));process.exitCode=1;
 if(ws?.readyState===WebSocket.OPEN)await captureFailure();
}finally{if(ws?.readyState===WebSocket.OPEN){await cdp('Browser.close').catch(()=>{});ws.close()}chrome.kill();const target=path.resolve(profile);assert.ok(target.startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(target)==='perfil');try{rmSync(target,{recursive:true,force:true,maxRetries:3,retryDelay:200})}catch{/* Limpieza de recursos de QA: el navegador puede haber cerrado el perfil. */}}
async function captureFailure(){try{const s=await cdp('Page.captureScreenshot',{format:'png'});writeFileSync(path.join(folder,'fallo.png'),Buffer.from(s.data,'base64'))}catch{/* Limpieza de recursos de QA: el navegador puede haber cerrado el perfil. */}}
