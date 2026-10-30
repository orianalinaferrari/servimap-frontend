// Demo PRESTADOR: solo loopback y datos sinteticos en memoria.
import { iniciarDemo } from './demo-local.mjs'
import { crearDemoPrestador } from './prestador-datos.mjs'
const escenario = process.argv.find((arg) => arg.startsWith('--escenario='))?.split('=')[1] ?? 'completo'
await iniciarDemo({ api: crearDemoPrestador(escenario), rol: 'PRESTADOR', puertoWeb: 4192, puertoApi: 4193, escenario, rutaInicial: '/prestador' })
