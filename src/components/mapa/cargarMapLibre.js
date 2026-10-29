import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

let carga

export function cargarMapLibre() {
  if (!window.WebGLRenderingContext && !window.WebGL2RenderingContext) {
    return Promise.reject(new Error('Este navegador no dispone de WebGL.'))
  }
  carga ??= import('maplibre-gl').then((api) => {
    api.setWorkerUrl(workerUrl)
    return api
  }).catch((error) => {
    carga = undefined
    throw new Error('No se pudo cargar MapLibre. Recargá la página. Si persiste después de actualizar dependencias, reiniciá Vite con npm run dev -- --force.', { cause: error })
  })
  return carga
}
