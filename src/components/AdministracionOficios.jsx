import { useState } from 'react'
import {
  cargarCatalogoOficios,
  guardarCatalogoOficios,
  crearOficio,
  modificarOficio,
  cambiarEstadoOficio,
} from '../utils/adminOficios'
import '../styles/AdministracionOficios.css'

export function AdministracionOficios() {
  const [catalogo, setCatalogo] = useState(cargarCatalogoOficios)
  const [nombre, setNombre] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  function aplicarCambio(siguiente, confirmacion) {
    try {
      guardarCatalogoOficios(siguiente)
      setCatalogo(siguiente)
      setMensaje(confirmacion)
      setError('')
      return true
    } catch {
      setError('No se pudieron guardar los cambios.')
      setMensaje('')
      return false
    }
  }

  function guardarFormulario(evento) {
    evento.preventDefault()

    try {
      const siguiente = editandoId === null
        ? crearOficio(catalogo, nombre)
        : modificarOficio(catalogo, editandoId, nombre)

      const confirmacion = editandoId === null
        ? 'Oficio creado correctamente.'
        : 'Oficio modificado correctamente.'

      if (aplicarCambio(siguiente, confirmacion)) {
        setNombre('')
        setEditandoId(null)
      }
    } catch (errorValidacion) {
      setError(errorValidacion.message)
      setMensaje('')
    }
  }

  function iniciarEdicion(oficio) {
    setEditandoId(oficio.id)
    setNombre(oficio.nombre)
    setMensaje('')
    setError('')
  }

  function cancelarEdicion() {
    setEditandoId(null)
    setNombre('')
    setMensaje('')
    setError('')
  }

  function alternarEstado(oficio) {
    try {
      const siguiente = cambiarEstadoOficio(
        catalogo,
        oficio.id,
        !oficio.activo
      )

      aplicarCambio(
        siguiente,
        oficio.activo
          ? 'Oficio desactivado correctamente.'
          : 'Oficio activado correctamente.'
      )
    } catch (errorCambio) {
      setError(errorCambio.message)
      setMensaje('')
    }
  }

  const activos = catalogo.filter((oficio) => oficio.activo).length

  return (
    <section className="admin-oficios" aria-labelledby="admin-oficios-titulo">
      <header className="admin-oficios-encabezado">
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

      <form className="admin-oficios-formulario" onSubmit={guardarFormulario}>
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
          <button type="submit">
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

      <h4>Listado de oficios</h4>

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
                  <td>{oficio.nombre}</td>
                  <td>
                    <span className={
                      oficio.activo
                        ? 'admin-oficios-activo'
                        : 'admin-oficios-inactivo'
                    }>
                      {oficio.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-oficios-acciones">
                      <button
                        type="button"
                        onClick={() => iniciarEdicion(oficio)}
                        aria-label={`Editar ${oficio.nombre}`}
                      >
                        Editar
                      </button>
                      <button
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
  )
}
