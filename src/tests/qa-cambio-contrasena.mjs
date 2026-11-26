// QA de corrección #8: solo loopback y API simulada, sin credenciales reales.
import assert from 'node:assert/strict'
import { crearApiSimulada } from '../../scripts/qa/api-simulada.mjs'
import { iniciarDemo } from '../../scripts/qa/demo-local.mjs'
import { ejecutarRecorridoDemo } from '../../scripts/qa/runner-demo.mjs'

for (const rol of ['CLIENTE', 'PRESTADOR']) {
  const fixture = crearApiSimulada()
  let cambios = 0
  const api = { responder(peticion) {
    if (new URL(peticion.url).pathname !== '/api/auth/me/password') return fixture.responder(peticion)
    assert.equal(peticion.method, 'PATCH', 'Método confirmado')
    assert.ok(peticion.headers.authorization?.startsWith('Bearer '), 'Autenticado')
    assert.deepEqual(Object.keys(peticion.body).sort(), ['passwordActual', 'passwordNueva'], 'Solo campos admitidos')
    assert.ok(peticion.body.passwordActual.startsWith(' ') && peticion.body.passwordNueva.endsWith(' '), 'Espacios conservados')
    cambios++
    return { status: 200, body: { mensaje: 'Contraseña actualizada' } }
  } }
  const ruta = `/${rol.toLowerCase()}/perfil`
  const demo = await iniciarDemo({ api, rol, puertoWeb: 4196, puertoApi: 4197, rutaInicial: ruta })
  try {
    await ejecutarRecorridoDemo({ nombre: `contrasena-${rol.toLowerCase()}`, apiOrigin: 'http://127.0.0.1:4197', url: 'http://127.0.0.1:4196' + ruta,
      recorrido: async ({ cdp, ev, until, check, click, screens }) => {
        await until('[...document.querySelectorAll("button")].some(b=>b.textContent==="Cambiar contraseña")', 'Cuenta lista')
        await click('Cambiar contraseña')
        check(await ev('document.activeElement.name==="passwordActual"'), 'Foco inicial')
        await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
        await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
        check(await ev('document.activeElement.name==="passwordNueva"'), 'Orden de teclado')
        check(await ev('[...document.querySelectorAll("input[name]")].filter(e=>e.type==="password" && e.labels.length===1 && e.required).length===3'), 'Tres campos enmascarados y etiquetados')
        await ev(`(() => {
          const valores = [' ' + 'Anterior ficticia', 'Nueva ficticia' + ' ', 'Nueva ficticia' + ' '];
          document.querySelectorAll('input[type=password]').forEach((campo, i) => {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(campo, valores[i]);
            campo.dispatchEvent(new Event('input', { bubbles: true }));
          });
        })()`)
        check(await ev('!document.body.innerText.includes(document.querySelector("input[name=passwordNueva]").value)'), 'Sin exposición en texto visible')
        await screens('formulario-contrasena')
        await click('Guardar contraseña')
        await until('document.body.innerText.includes("Contraseña actualizada.")', 'Confirmación')
        check(cambios === 1, 'Una sola escritura simulada')
        await click('Cambiar contraseña')
        check(await ev('[...document.querySelectorAll("input[type=password]")].every(e=>e.value==="")'), 'Campos limpios tras éxito')
        await click('Cancelar')
        await until('document.activeElement.textContent==="Cambiar contraseña"', 'Retorno del foco')
        check(await ev('!localStorage.length && sessionStorage.length===1 && !!sessionStorage.getItem("servimap-jwt")'), 'Almacenamiento solo JWT')
        return 'Cambio de contraseña ' + rol + ', contrato simulado'
      } })
    assert.equal(process.exitCode || 0, 0, 'QA de navegador aprobado')
  } finally {
    await demo.cerrar()
  }
}
