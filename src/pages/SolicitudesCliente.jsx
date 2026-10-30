import EstadoSolicitud from '../components/EstadoSolicitud'
import CamposDetalleSolicitud from '../components/CamposDetalleSolicitud'
import { IconoPrestador as IconoCliente } from '../components/prestador/IconoPrestador'
import { EstrellasCalificacion } from '../components/cliente/EstrellasCalificacion'
import CalificarPrestador from '../components/CalificarPrestador'
import { registrarCalificacion } from '../services/calificacionesService'
import {
  puedeCalificarSolicitud,
  obtenerCalificacionSolicitud,
} from '../utils/calificacionSolicitud'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  obtenerSolicitudesCliente,
  cancelarSolicitudCliente,
} from '../services/solicitudesClienteService'
import {
  obtenerAccionesSolicitud,
  ordenarSolicitudesPorFecha,
} from '../utils/solicitudesCliente'
import '../styles/SolicitudesCliente.css'

function mostrarValor(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return 'No informado'
  }

  return String(valor)
}

function obtenerNombrePrestador(solicitud) {
  if (typeof solicitud.prestador === 'string') {
    return solicitud.prestador
  }

  if (solicitud.prestador?.nombre) {
    return solicitud.prestador.nombre
  }

  return solicitud.nombrePrestador || 'Prestador no informado'
}

function DetalleSolicitud({ solicitud, onCerrar }) {
  return (
    <section className="solicitudes-cliente-detalle">
      <div className="solicitudes-cliente-encabezado">
        <h3>Detalle de solicitud #{solicitud.id}</h3>
        <button type="button" onClick={onCerrar}>
          Cerrar detalle
        </button>
      </div>

      <dl>
        <dt>Estado</dt>
        <dd><EstadoSolicitud estado={solicitud.estado} /></dd>

        <dt>Prestador</dt>
        <dd>{obtenerNombrePrestador(solicitud)}</dd>

        <CamposDetalleSolicitud solicitud={solicitud} formatear={mostrarValor} />
      </dl>
    </section>
  )
}

function SolicitudesCliente() {
  const [solicitudes, setSolicitudes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null)
  const [cancelandoId, setCancelandoId] = useState(null)
  const [confirmandoId, setConfirmandoId] = useState(null)
  const [calificandoId, setCalificandoId] = useState(null)
  const [enviandoCalificacionId, setEnviandoCalificacionId] = useState(null)
  const [calificacionesRegistradas, setCalificacionesRegistradas] = useState({})

  const cargarSolicitudes = useCallback(async () => {
    setCargando(true)
    setError('')

    try {
      const resultado = await obtenerSolicitudesCliente()
      setSolicitudes(ordenarSolicitudesPorFecha(resultado))
    } catch (errorCarga) {
      setSolicitudes([])
      setError(
        errorCarga instanceof Error
          ? errorCarga.message
          : 'No se pudieron cargar las solicitudes.'
      )
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    let activo = true

    async function cargarInicial() {
      try {
        const resultado = await obtenerSolicitudesCliente()

        if (activo) {
          setSolicitudes(ordenarSolicitudesPorFecha(resultado))
        }
      } catch (errorCarga) {
        if (activo) {
          setSolicitudes([])
          setError(
            errorCarga instanceof Error
              ? errorCarga.message
              : 'No se pudieron cargar las solicitudes.'
          )
        }
      } finally {
        if (activo) {
          setCargando(false)
        }
      }
    }

    void cargarInicial()

    return () => {
      activo = false
    }
  }, [])

  async function cancelar(solicitud) {
    const acciones = obtenerAccionesSolicitud(solicitud)

    if (!acciones.cancelar || cancelandoId !== null) {
      return
    }

    setMensaje('')
    setError('')
    setCancelandoId(solicitud.id)

    try {
      await cancelarSolicitudCliente(solicitud.id)
    } catch (errorCancelacion) {
      setError(
        errorCancelacion instanceof Error
          ? errorCancelacion.message
          : 'No se pudo cancelar la solicitud.'
      )
      setCancelandoId(null)
      return
    }

    setSolicitudSeleccionada(null)
    setConfirmandoId(null)
    setMensaje('La cancelación fue confirmada por el servidor.')
    setCancelandoId(null)
    await cargarSolicitudes()
  }

  async function enviarCalificacion(solicitud, datos) {
    if (
      !puedeCalificarSolicitud(solicitud) ||
      calificacionesRegistradas[solicitud.id] ||
      enviandoCalificacionId !== null
    ) {
      return
    }

    setError('')
    setMensaje('')
    setEnviandoCalificacionId(solicitud.id)

    try {
      const resultado = await registrarCalificacion(solicitud.id, datos)

      setCalificacionesRegistradas((actuales) => ({
        ...actuales,
        [solicitud.id]: {
          puntaje: resultado?.puntaje ?? datos.puntaje,
          comentario: resultado?.comentario ?? datos.comentario,
        },
      }))

      setCalificandoId(null)
      setMensaje('La calificación fue registrada correctamente.')
    } catch (errorCalificacion) {
      setError(
        errorCalificacion instanceof Error
          ? errorCalificacion.message
          : 'No se pudo registrar la calificación.'
      )
    } finally {
      setEnviandoCalificacionId(null)
    }
  }

  return (
    <main className="solicitudes-cliente cliente-pagina">
      <header className="solicitudes-cliente-cabecera">
        <div>
          <h1>Mis solicitudes</h1>
          <p>Consultá el estado y los detalles de los servicios solicitados.</p>
        </div>

        <Link to="/cliente">Volver al panel</Link>
      </header>

      {mensaje && (
        <p role="status" className="solicitudes-cliente-exito">
          {mensaje}
        </p>
      )}

      {error && (
        <div role="alert" className="solicitudes-cliente-error">
          <p>{error}</p>
          <button type="button" onClick={cargarSolicitudes}>
            Reintentar
          </button>
        </div>
      )}

      {cargando && (
        <p role="status">Cargando solicitudes...</p>
      )}

      {!cargando && !error && solicitudes.length === 0 && (
        <section className="solicitudes-cliente-vacio">
          <h2>Todavía no tenés solicitudes</h2>
          <p>Cuando solicites un servicio, podrás consultar su estado acá.</p>
          <Link to="/">Buscar prestadores</Link>
        </section>
      )}

      {!cargando && solicitudes.length > 0 && (
        <section aria-label="Listado de solicitudes">
          <h2>Solicitudes realizadas</h2>

          <div className="solicitudes-cliente-listado">
            {solicitudes.map((solicitud) => {
              const acciones = obtenerAccionesSolicitud(solicitud)
              const mostrandoDetalle =
                solicitudSeleccionada?.id === solicitud.id

              return (
                <article
                  className="solicitudes-cliente-tarjeta"
                  key={solicitud.id}
                >
                  <div className="solicitudes-cliente-tarjeta-superior">
                    <h3>
                      <span className="cliente-icono-suave"><IconoCliente tipo="oficio" /></span>
                      {mostrarValor(solicitud.servicio)}
                    </h3>

                    <span className="solicitudes-cliente-estado">
                      <EstadoSolicitud estado={solicitud.estado} />
                    </span>
                  </div>

                  <p>
                    <strong>Prestador:</strong>{' '}
                    {obtenerNombrePrestador(solicitud)}
                  </p>

                  <p>
                    <strong>Solicitud:</strong> #{solicitud.id}
                  </p>

                  <div className="solicitudes-cliente-acciones">
                    {acciones.verDetalle && (
                      <button
                        type="button"
                        onClick={() => {
                          setSolicitudSeleccionada(
                            mostrandoDetalle ? null : solicitud
                          )
                          setConfirmandoId(null)
                        }}
                      >
                        <IconoCliente tipo="solicitudes" />{mostrandoDetalle ? 'Ocultar detalle' : 'Ver detalle'}
                      </button>
                    )}



                    {puedeCalificarSolicitud(solicitud) &&
                      !calificacionesRegistradas[solicitud.id] && (
                        <button
                          type="button"
                          disabled={enviandoCalificacionId !== null}
                          onClick={() => {
                            setSolicitudSeleccionada(solicitud)
                            setCalificandoId(solicitud.id)
                            setConfirmandoId(null)
                          }}
                        >
                          <IconoCliente tipo="estrella" />Calificar prestador
                        </button>
                      )}

                    {acciones.cancelar && (
                      <button
                        type="button"
                        className="solicitudes-cliente-cancelar"
                        disabled={cancelandoId !== null}
                        onClick={() => {
                          setSolicitudSeleccionada(solicitud)
                          setConfirmandoId(solicitud.id)
                        }}
                      >
                        Preparar cancelación
                      </button>
                    )}
                  </div>

                  {mostrandoDetalle && (
                    <>
                      <DetalleSolicitud
                        solicitud={solicitud}
                        onCerrar={() => {
                          setSolicitudSeleccionada(null)
                          setConfirmandoId(null)
                        }}
                      />



                      {calificandoId === solicitud.id &&
                        puedeCalificarSolicitud(solicitud) &&
                        !calificacionesRegistradas[solicitud.id] && (
                          <CalificarPrestador
                            solicitud={solicitud}
                            enviando={enviandoCalificacionId === solicitud.id}
                            onEnviar={(datos) =>
                              enviarCalificacion(solicitud, datos)
                            }
                            onCancelar={() => setCalificandoId(null)}
                          />
                        )}

                      {(calificacionesRegistradas[solicitud.id] ||
                        obtenerCalificacionSolicitud(solicitud)) && (
                          <section className="cliente-calificacion-registrada" aria-label="Calificación registrada">
                            <h4>Calificación del servicio</h4>
                            <EstrellasCalificacion puntaje={(calificacionesRegistradas[solicitud.id] || obtenerCalificacionSolicitud(solicitud)).puntaje} />
                            <p>
                              Puntuación:{' '}
                              {(
                                calificacionesRegistradas[solicitud.id] ||
                                obtenerCalificacionSolicitud(solicitud)
                              ).puntaje} de 5
                            </p>
                            {(
                              calificacionesRegistradas[solicitud.id] ||
                              obtenerCalificacionSolicitud(solicitud)
                            ).comentario && (
                              <p>
                                {(
                                  calificacionesRegistradas[solicitud.id] ||
                                  obtenerCalificacionSolicitud(solicitud)
                                ).comentario}
                              </p>
                            )}
                          </section>
                        )}

                      {acciones.cancelar && confirmandoId === solicitud.id && (
                        <div className="solicitudes-cliente-confirmacion">
                          <p>
                            ¿Querés cancelar esta solicitud? Esta acción
                            debe ser confirmada.
                          </p>

                          <button
                            type="button"
                            className="solicitudes-cliente-cancelar"
                            disabled={cancelandoId !== null}
                            onClick={() => cancelar(solicitud)}
                          >
                            {cancelandoId === solicitud.id
                              ? 'Cancelando...'
                              : 'Confirmar cancelación'}
                          </button>

                          <button
                            type="button"
                            disabled={cancelandoId !== null}
                            onClick={() => {
                              setSolicitudSeleccionada(null)
                              setConfirmandoId(null)
                            }}
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

export default SolicitudesCliente
