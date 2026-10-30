import assert from 'node:assert/strict'
import { get } from 'node:http'
import { createServer } from 'vite'

function comprobarHttp(url) {
  return new Promise((resolve, reject) => {
    const request = get(url, { signal: AbortSignal.timeout(10000) }, response => {
      response.resume()
      response.once('error', reject)
      response.once('end', () => {
        if (response.statusCode === 200) resolve()
        else reject(new Error(`Vite readiness HTTP ${response.statusCode}`))
      })
    })
    request.once('error', reject)
  })
}

export async function iniciarServidorQa({ root, port = 0, configFile }) {
  const server = await createServer({ root, configFile, server: { host: '127.0.0.1', port, strictPort: true } })
  try {
    // listen() resolves on the actual listening event, independent of CLI colors/chunks.
    await server.listen()
    const address = server.httpServer.address()
    assert.ok(address && typeof address === 'object', 'Vite did not bind a TCP port')
    const url = `http://127.0.0.1:${address.port}`
    await comprobarHttp(url)
    return { server, url }
  } catch (error) {
    await server.close()
    throw error
  }
}
