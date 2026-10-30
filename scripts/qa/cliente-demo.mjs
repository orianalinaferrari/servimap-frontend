// Demo CLIENTE: no modifica autenticación ni configuración productiva.
import { iniciarDemo } from './demo-local.mjs'
import { crearDemoCliente } from './cliente-datos.mjs'
const escenario = process.argv.find((arg) => arg.startsWith('--escenario='))?.split('=')[1] ?? 'completo'
await iniciarDemo({ api: crearDemoCliente(escenario), rol: 'CLIENTE', puertoWeb: 4194, puertoApi: 4195, escenario, rutaInicial: '/cliente' })
