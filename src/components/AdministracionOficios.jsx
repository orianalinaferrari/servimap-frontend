import { useEffect, useState } from 'react'
import { listarTodosLosOficios, crearOficioRemoto, actualizarOficio, cambiarEstadoOficioRemoto } from '../services/prestadoresService'
import '../styles/AdministracionOficios.css'
import { IconoAdministracion } from './IconoAdministracion'

export function AdministracionOficios() {
  const [catalogo, setCatalogo] = useState([])
  const [nombre, setNombre] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let activo = true
    listarTodosLosOficios().then((lista) => { if (activo) { setCatalogo(lista); setError('') } }).catch((fallo) => { if (activo) setError(fallo.message) }).finally(() => { if (activo) setCargando(false) })
    return () => { activo = false }
  }, [revision])
  async function guardarFormulario(evento) {
    evento.preventDefault()
    if (enviando || cargando) return
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    setEnviando(true); setError(''); setMensaje('')
    try {
      const dato = editandoId === null ? await crearOficioRemoto({ nombre: nombre.trim() }) : await actualizarOficio(editandoId, { nombre: nombre.trim() })
      setCatalogo((lista) => editandoId === null ? [...lista, dato] : lista.map((oficio) => oficio.id === dato.id ? dato : oficio))
      setNombre(''); setEditandoId(null); setMensaje('Oficio guardado en el servidor.')
    } catch (fallo) { setError(fallo.message) } finally { setEnviando(false) }
  }
  function iniciarEdicion(oficio) { setEditandoId(oficio.id); setNombre(oficio.nombre); setError(''); setMensaje('') }
  function cancelarEdicion() { setEditandoId(null); setNombre(''); setError(''); setMensaje('') }
  async function alternarEstado(oficio) {
    if (enviando || cargando) return
    setEnviando(true); setError(''); setMensaje('')
    try {
      const dato = await cambiarEstadoOficioRemoto(oficio.id, !oficio.activo)
      setCatalogo((lista) => lista.map((item) => item.id === dato.id ? dato : item))
      setMensaje('Estado actualizado en el servidor.')
    } catch (fallo) { setError(fallo.message) } finally { setEnviando(false) }
  }

  const activos = catalogo.filter((oficio) => oficio.activo).length

  return (
    <section className="admin-oficios" aria-labelledby="admin-oficios-titulo">
      <header className="admin-oficios-encabezado">
        <span className="admin-icono-circulo"><IconoAdministracion tipo="configuracion" /></span>
        <div>
          <h3 id="admin-oficios-titulo">Administración de oficios</h3>
          <p>
            Gestioná el catálogo de oficios disponibles en ServiMap.
          </p>
        </div>
        <div className="admin-oficios-resumen">
          <span>Total: {catalogo.length}</span>
          <span>Activos: {activos}</span>
        </div>
      </header>

      <form className="admin-oficios-formulario admin-tarjeta" onSubmit={guardarFormulario}>
        <h4>{editandoId === null ? 'Crear oficio' : 'Modificar oficio'}</h4>

        <label htmlFor="admin-oficio-nombre">Nombre del oficio</label>

        <input
          id="admin-oficio-nombre"
          value={nombre}
          onChange={(evento) => setNombre(evento.target.value)}
          maxLength={60}
          placeholder="Ej.: Albañil"
        />

        <div className="admin-oficios-acciones">
          <button type="submit" disabled={enviando || cargando}>
            {editandoId === null ? 'Crear oficio' : 'Guardar cambios'}
          </button>

          {editandoId !== null && (
            <button type="button" onClick={cancelarEdicion}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      {mensaje && <p role="status" className="admin-oficios-exito">{mensaje}</p>}
      {error && <p role="alert" className="admin-oficios-error">{error}</p>}

      <section className="admin-tarjeta admin-oficios-listado" aria-labelledby="admin-listado-titulo">
      <h4 id="admin-listado-titulo">Listado de oficios</h4>
      {cargando && <p role="status">Cargando catálogo...</p>}
      {error && <button type="button" onClick={() => setRevision((n) => n + 1)}>Reintentar catálogo</button>}

      {catalogo.length === 0 ? (
        <p>No hay oficios registrados.</p>
      ) : (
        <div className="admin-oficios-tabla-contenedor">
          <table className="admin-oficios-tabla">
            <thead>
              <tr>
                <th scope="col">Oficio</th>
                <th scope="col">Estado</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {catalogo.map((oficio) => (
                <tr key={oficio.id}>
                  <td data-label="Oficio">{oficio.nombre}</td>
                  <td data-label="Estado">
                    <span className={
                      oficio.activo
                        ? 'admin-oficios-activo'
                        : 'admin-oficios-inactivo'
                    }>
                      {oficio.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td data-label="Acciones">
                    <div className="admin-oficios-acciones">
                      <button
                        disabled={enviando || cargando}
                        type="button"
                        onClick={() => iniciarEdicion(oficio)}
                        aria-label={`Editar ${oficio.nombre}`}
                      >
                        Editar
                      </button>
                      <button
                        className={oficio.activo ? 'admin-desactivar' : 'admin-activar'}
                        disabled={enviando || cargando}
                        type="button"
                        onClick={() => alternarEstado(oficio)}
                        aria-label={
                          `${oficio.activo ? 'Desactivar' : 'Activar'} ${oficio.nombre}`
                        }
                      >
                        {oficio.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </section>
    </section>
  )
}
