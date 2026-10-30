import EstadoSolicitud from '../components/EstadoSolicitud'
import { IconoPrestador } from '../components/prestador/IconoPrestador'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  obtenerSolicitudesPrestador,
  aceptarSolicitudPrestador,
  rechazarSolicitudPrestador,
  marcarTrabajoTerminadoPrestador,
} from '../services/solicitudesPrestadorService'
import {
  obtenerAccionesSolicitudPrestador,
  ordenarSolicitudesPorFecha,
} from '../utils/solicitudesPrestador'
import {
  puedeMarcarTrabajoTerminado,
} from '../utils/finalizacionSolicitud'
import '../styles/SolicitudesPrestador.css'

function mostrarValor(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return 'No informado'
  }

  if (typeof valor === 'object') {
    return valor.nombre || valor.descripcion || 'No informado'
  }

  return String(valor)
}

function obtenerNombreCliente(solicitud) {
  if (typeof solicitud.cliente === 'string') {
    return solicitud.cliente
  }

  if (solicitud.cliente?.nombre) {
    const apellido = solicitud.cliente.apellido
      ? ` ${solicitud.cliente.apellido}`
      : ''

    return `${solicitud.cliente.nombre}${apellido}`
  }

  return solicitud.nombreCliente || 'Cliente no informado'
}

function DetalleSolicitudPrestador({ solicitud, onCerrar }) {
  return (
    <section className="solicitudes-prestador-detalle">
      <div className="solicitudes-prestador-encabezado">
        <h3>Detalle de solicitud #{solicitud.id}</h3>
        <button type="button" onClick={onCerrar}>
          Cerrar detalle
        </button>
      </div>

      <dl>
        <dt>Estado</dt>
        <dd><EstadoSolicitud estado={solicitud.estado} /></dd>

        <dt>Cliente</dt>
        <dd>{obtenerNombreCliente(solicitud)}</dd>

        <dt>Servicio</dt>
        <dd>{mostrarValor(solicitud.servicio)}</dd>

        <dt>Descripción</dt>
        <dd>{mostrarValor(solicitud.descripcion)}</dd>

        <dt>Dirección</dt>
        <dd>{mostrarValor(solicitud.direccion)}</dd>

        <dt>Contacto preferido</dt>
        <dd>{mostrarValor(solicitud.contactoPreferido)}</dd>

        <dt>Fecha de creación</dt>
        <dd>{mostrarValor(solicitud.fechaCreacion)}</dd>
      </dl>
    </section>
  )
}

function SolicitudesPrestador() {
  const [solicitudes, setSolicitudes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null)
  const [accionPendiente, setAccionPendiente] = useState(null)
  const [procesandoId, setProcesandoId] = useState(null)

  const cargarSolicitudes = useCallback(async () => {
    setCargando(true)
    setError('')

    try {
      const resultado = await obtenerSolicitudesPrestador()
      setSolicitudes(ordenarSolicitudesPorFecha(resultado))
      return true
    } catch (errorCarga) {
      setSolicitudes([])
      setError(
        errorCarga instanceof Error
          ? errorCarga.message
          : 'No se pudieron cargar las solicitudes recibidas.'
      )
      return false
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    let activo = true

    async function cargarInicial() {
      try {
        const resultado = await obtenerSolicitudesPrestador()

        if (activo) {
          setSolicitudes(ordenarSolicitudesPorFecha(resultado))
        }
      } catch (errorCarga) {
        if (activo) {
          setSolicitudes([])
          setError(
            errorCarga instanceof Error
              ? errorCarga.message
              : 'No se pudieron cargar las solicitudes recibidas.'
          )
        }
      } finally {
        if (activo) {
          setCargando(false)
        }
      }
    }

    cargarInicial()

    return () => {
      activo = false
    }
  }, [])

  function prepararAccion(solicitud, accion) {
    const acciones = obtenerAccionesSolicitudPrestador(solicitud)

    const permitida =
      accion === 'finalizar'
        ? puedeMarcarTrabajoTerminado(solicitud)
        : acciones[accion]

    if (!permitida || procesandoId !== null) {
      return
    }

    setSolicitudSeleccionada(solicitud)
    setAccionPendiente(accion)
    setError('')
    setMensaje('')
  }

  async function confirmarAccion() {
    if (!solicitudSeleccionada || !accionPendiente || procesandoId !== null) {
      return
    }

    const acciones = obtenerAccionesSolicitudPrestador(
      solicitudSeleccionada
    )

    const permitida =
      accionPendiente === 'finalizar'
        ? puedeMarcarTrabajoTerminado(solicitudSeleccionada)
        : acciones[accionPendiente]

    if (!permitida) {
      return
    }

    const solicitudId = solicitudSeleccionada.id
    const accion = accionPendiente

    setProcesandoId(solicitudId)
    setError('')
    setMensaje('')

    try {
      if (accion === 'aceptar') {
        await aceptarSolicitudPrestador(solicitudId)
      } else if (accion === 'rechazar') {
        await rechazarSolicitudPrestador(solicitudId)
      } else if (accion === 'finalizar') {
        await marcarTrabajoTerminadoPrestador(solicitudId)
      }
    } catch (errorAccion) {
      setError(
        errorAccion instanceof Error
          ? errorAccion.message
          : 'No se pudo responder a la solicitud.'
      )
      setProcesandoId(null)
      return
    }

    setSolicitudSeleccionada(null)
    setAccionPendiente(null)
    setProcesandoId(null)

    setMensaje(
      accion === 'aceptar'
        ? 'La aceptación fue confirmada por el servidor.'
        : accion === 'rechazar'
          ? 'El rechazo fue confirmado por el servidor.'
          : 'El trabajo terminado fue informado al servidor.'
    )

    await cargarSolicitudes()
  }

  function cerrarDetalle() {
    if (procesandoId !== null) {
      return
    }

    setSolicitudSeleccionada(null)
    setAccionPendiente(null)
  }

  return (
    <main className="solicitudes-prestador prestador-pagina">
      <header className="solicitudes-prestador-cabecera">
        <div>
          <h1>Solicitudes recibidas</h1>
          <p>
            Consultá los pedidos de tus clientes y respondé las
            solicitudes pendientes.
          </p>
        </div>

        <Link to="/prestador">Volver al panel</Link>
      </header>

      {mensaje && (
        <p role="status" className="solicitudes-prestador-exito">
          {mensaje}
        </p>
      )}

      {error && (
        <div role="alert" className="solicitudes-prestador-error">
          <p>{error}</p>
          <button type="button" onClick={cargarSolicitudes}>
            Reintentar consulta
          </button>
        </div>
      )}

      {cargando && (
        <p role="status">Cargando solicitudes recibidas...</p>
      )}

      {!cargando && !error && solicitudes.length === 0 && (
        <section className="solicitudes-prestador-vacio">
          <h2>Todavía no recibiste solicitudes</h2>
          <p>
            Cuando un cliente solicite tus servicios,
            vas a poder consultar sus pedidos acá.
          </p>
        </section>
      )}

      {!cargando && solicitudes.length > 0 && (
        <section aria-label="Listado de solicitudes recibidas">
          <h2>Pedidos de clientes</h2>

          <div className="solicitudes-prestador-listado">
            {solicitudes.map((solicitud) => {
              const acciones = obtenerAccionesSolicitudPrestador(solicitud)
              const mostrandoDetalle =
                solicitudSeleccionada?.id === solicitud.id

              return (
                <article
                  className="solicitudes-prestador-tarjeta"
                  key={solicitud.id}
                >
                  <div className="solicitudes-prestador-tarjeta-superior">
                    <h3><span className="prestador-icono-suave"><IconoPrestador tipo="oficio" /></span>{mostrarValor(solicitud.servicio)}</h3>

                    <span className="solicitudes-prestador-estado">
                      <EstadoSolicitud estado={solicitud.estado} />
                    </span>
                  </div>

                  <p>
                    <strong>Cliente:</strong>{' '}
                    {obtenerNombreCliente(solicitud)}
                  </p>

                  <p>
                    <strong>Solicitud:</strong> #{solicitud.id}
                  </p>

                  <div className="solicitudes-prestador-acciones">
                    {acciones.verDetalle && (
                      <button
                        type="button"
                        disabled={procesandoId !== null}
                        onClick={() => {
                          if (mostrandoDetalle) {
                            cerrarDetalle()
                          } else {
                            setSolicitudSeleccionada(solicitud)
                            setAccionPendiente(null)
                          }
                        }}
                      >
                        <IconoPrestador tipo="solicitudes" />{mostrandoDetalle ? 'Ocultar detalle' : 'Ver detalle'}
                      </button>
                    )}

                    {acciones.aceptar && (
                      <button
                        type="button"
                        className="solicitudes-prestador-aceptar"
                        disabled={procesandoId !== null}
                        onClick={() => prepararAccion(solicitud, 'aceptar')}
                      >
                        Aceptar solicitud
                      </button>
                    )}

                    {puedeMarcarTrabajoTerminado(solicitud) && (
                      <button
                        type="button"
                        disabled={procesandoId !== null}
                        onClick={() => prepararAccion(solicitud, 'finalizar')}
                      >
                        Marcar trabajo como terminado
                      </button>
                    )}



                    {acciones.rechazar && (
                      <button
                        type="button"
                        className="solicitudes-prestador-rechazar"
                        disabled={procesandoId !== null}
                        onClick={() => prepararAccion(solicitud, 'rechazar')}
                      >
                        Rechazar solicitud
                      </button>
                    )}
                  </div>

                  {mostrandoDetalle && (
                    <>
                      <DetalleSolicitudPrestador
                        solicitud={solicitud}
                        onCerrar={cerrarDetalle}
                      />

                      {accionPendiente && (
                        <div className="solicitudes-prestador-confirmacion">
                          <p>
                            ¿Confirmás que querés{' '}
                            {accionPendiente === 'finalizar'
                              ? 'informar que terminaste el trabajo de'
                              : accionPendiente === 'aceptar'
                                ? 'aceptar'
                                : 'rechazar'}{' '}
                            esta solicitud?
                          </p>

                          <button
                            type="button"
                            disabled={procesandoId !== null}
                            onClick={confirmarAccion}
                          >
                            {procesandoId === solicitud.id
                              ? 'Procesando...'
                              : accionPendiente === 'aceptar'
                                ? 'Confirmar aceptación'
                                : accionPendiente === 'rechazar'
                                  ? 'Confirmar rechazo'
                                  : 'Confirmar trabajo terminado'}
                          </button>

                          <button
                            type="button"
                            disabled={procesandoId !== null}
                            onClick={() => setAccionPendiente(null)}
                          >
                            Volver
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </article>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}

export default SolicitudesPrestador
