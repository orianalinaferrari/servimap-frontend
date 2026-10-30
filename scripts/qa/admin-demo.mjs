// Vista interactiva de QA: solo loopback, API en memoria y sesión sintética existente.
// No se importa desde src/ ni se incluye en el build de producción.
import { iniciarDemo } from './demo-local.mjs'
import { crearDemoAdmin } from './admin-datos.mjs'

await iniciarDemo({ api: crearDemoAdmin(), rol: 'ADMINISTRADOR', puertoWeb: 4190, puertoApi: 4191, rutaInicial: '/admin', avisoId: 'qa-admin-aviso', restringirConexiones: false })
