// Recorrido QA contra prestador-demo.mjs en localhost; nunca usa el backend publicado.
import{spawn}from'node:child_process';import{mkdtempSync,existsSync,readFileSync,writeFileSync,rmSync}from'node:fs';import os from'node:os';import path from'node:path';import assert from'node:assert/strict';
const folder=mkdtempSync(path.join(os.tmpdir(),'servimap-prestador-')),profile=path.join(folder,'perfil'),wait=ms=>new Promise(r=>setTimeout(r,ms));let ws,seq=0,blocked=0;const pending=new Map(),results=[],errors=[],requests=[];
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--remote-debugging-port=0','--user-data-dir='+profile,'--disk-cache-size=1048576','--no-first-run','--disable-extensions','--disable-background-networking','--disable-sync','about:blank'],{windowsHide:true,stdio:'ignore'});
function cdp(method,params={}){return new Promise((r,j)=>{const id=++seq,t=setTimeout(()=>j(Error(method+' timeout')),30000);pending.set(id,{r:x=>{clearTimeout(t);r(x)},j});ws.send(JSON.stringify({id,method,params}))})}async function ev(expression){const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true}).catch(e=>{throw Error(expression.slice(0,90)+': '+e.message)});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value}
async function shot(name,width,height){const s=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height,scale:1}});writeFileSync(path.join(folder,name+'.png'),Buffer.from(s.data,'base64'))}
try{const active=path.join(profile,'DevToolsActivePort');for(let i=0;i<100&&!existsSync(active);i++)await wait(100);assert.ok(existsSync(active));const port=readFileSync(active,'utf8').split(/\r?\n/)[0],tabs=await fetch('http://127.0.0.1:'+port+'/json/list').then(r=>r.json());ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});ws.onmessage=({data})=>{const m=JSON.parse(data),p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.j(Error(m.error.message)):p.r(m.result)}else if(m.method==='Fetch.requestPaused'){blocked++;cdp('Fetch.failRequest',{requestId:m.params.requestId,errorReason:'BlockedByClient'}).catch(()=>{})}else if(m.method==='Network.requestWillBeSent'){const u=new URL(m.params.request.url);if(u.origin==='http://127.0.0.1:4193')requests.push({method:m.params.request.method,path:u.pathname})}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text)};await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Fetch.enable',{patterns:[{urlPattern:'https://servimap-backend.vercel.app/*',requestStage:'Request'}]});


async function until(expression,name){for(let i=0;i<200;i++){if(await ev(expression))return;await wait(100)}throw Error(name)}
function check(value,name){assert.ok(value,name);results.push(name)}
async function go(route,condition){await ev('history.pushState(null,"",'+JSON.stringify(route)+');dispatchEvent(new PopStateEvent("popstate"))');await until(condition,route);await ev('document.fonts.ready.then(()=>true)')}
async function click(name,scope='document'){await ev('(()=>{const e=[...'+scope+'.querySelectorAll("button,a")].find(e=>(e.getAttribute("aria-label")||e.textContent).trim()==='+JSON.stringify(name)+'&&!e.disabled);if(!e)throw Error("Control ausente: "+'+JSON.stringify(name)+');e.click()})()');await wait(100)}
async function fill(id,value){await ev('(()=>{const e=document.getElementById('+JSON.stringify(id)+');const proto=e.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:e.tagName==="SELECT"?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,"value").set.call(e,'+JSON.stringify(value)+');e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}))})()')}
async function capture(name){const size=await ev('({width:innerWidth,height:document.documentElement.scrollHeight})');await shot(name,size.width,size.height)}
async function screens(name){for(const width of [1365,768,390,320]){await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<=390});await ev('scrollTo(0,0)');await wait(200);const fits=await ev('document.documentElement.scrollWidth<=innerWidth');check(fits,name+' sin overflow '+width);await capture(name+'-'+width)}await cdp('Emulation.setDeviceMetricsOverride',{width:1365,height:900,deviceScaleFactor:1,mobile:false})}
await cdp('Network.enable');
await cdp('Emulation.setDeviceMetricsOverride',{width:1365,height:900,deviceScaleFactor:1,mobile:false});
await cdp('Page.navigate',{url:'http://127.0.0.1:4192/prestador'});
await until('!!document.querySelector(".panel-prestador-indicadores")','Panel listo');
check(await ev('!!document.getElementById("qa-prestador-aviso")'),'Aviso QA');
check(await ev('!!document.querySelector("meta[http-equiv=Content-Security-Policy]")'),'CSP exclusiva QA');
check(await ev('!localStorage.length'),'Sin credenciales en localStorage');
const escenario=await ev('document.getElementById("qa-prestador-aviso").textContent.split(".")[0]');
await screens('panel');
await click('Mi perfil');
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
