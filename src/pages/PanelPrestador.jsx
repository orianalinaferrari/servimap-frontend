import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { obtenerSolicitudesPrestador } from '../services/solicitudesPrestadorService'
import {
  obtenerActividadRecientePrestador,
  resumirSolicitudesPrestador,
} from '../utils/panelPrestador'
import { obtenerEtiquetaEstado } from '../utils/estadosSolicitud'
import '../styles/PanelPrestador.css'

function obtenerNombreUsuario(usuario) {
  if (typeof usuario?.nombre === 'string' && usuario.nombre.trim()) {
    return usuario.nombre.trim()
  }

  return 'Prestador'
}

function obtenerNombreServicio(solicitud) {
  if (typeof solicitud?.servicio === 'string') {
    return solicitud.servicio || 'Servicio sin especificar'
  }

  if (solicitud?.servicio?.nombre) {
    return solicitud.servicio.nombre
  }

  return 'Servicio sin especificar'
}

function PanelPrestador() {
  const { usuario } = useAuth()

  const [solicitudes, setSolicitudes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargarSolicitudes = useCallback(async () => {
    setCargando(true)
    setError('')

    try {
      const resultado = await obtenerSolicitudesPrestador()
      setSolicitudes(resultado)
    } catch (errorCarga) {
      setSolicitudes([])
      setError(
        errorCarga instanceof Error
          ? errorCarga.message
          : 'No se pudo cargar la actividad del prestador.'
      )
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
          setSolicitudes(resultado)
        }
      } catch (errorCarga) {
        if (activo) {
          setError(
            errorCarga instanceof Error
              ? errorCarga.message
              : 'No se pudo cargar la actividad del prestador.'
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

  const resumen = resumirSolicitudesPrestador(solicitudes)
  const recientes = obtenerActividadRecientePrestador(solicitudes)

  return (
    <main className="panel-prestador">
      <header className="panel-prestador-encabezado">
        <div>
          <p className="panel-prestador-etiqueta">
            ESPACIO DEL PRESTADOR
          </p>
          <h1>Panel del prestador</h1>
          <p>
            Hola, {obtenerNombreUsuario(usuario)}.
            Gestioná tus servicios y consultá tu actividad en ServiMap.
          </p>
        </div>

        <Link
          className="panel-prestador-enlace-principal"
          to="/prestador/solicitudes"
        >
          Ver solicitudes
        </Link>
      </header>

      <section
        className="panel-prestador-seccion"
        aria-labelledby="panel-resumen-titulo"
      >
        <div className="panel-prestador-titulo-seccion">
          <div>
            <h2 id="panel-resumen-titulo">
              Resumen de actividad
            </h2>
            <p>Estado actual de tus solicitudes recibidas.</p>
          </div>

          <button
            type="button"
            onClick={cargarSolicitudes}
            disabled={cargando}
          >
            Actualizar
          </button>
        </div>

        {cargando && (
          <p role="status">
            Cargando actividad del prestador...
          </p>
        )}

        {error && !cargando && (
          <div className="panel-prestador-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={cargarSolicitudes}>
              Reintentar
            </button>
          </div>
        )}

        {!cargando && !error && (
          <>
            <div className="panel-prestador-indicadores">
              <article className="panel-prestador-indicador">
                <span>Solicitudes recibidas</span>
                <strong>{resumen.total}</strong>
              </article>

              <article className="panel-prestador-indicador">
                <span>Pendientes</span>
                <strong>{resumen.pendientes}</strong>
              </article>

              <article className="panel-prestador-indicador">
                <span>Aceptadas</span>
                <strong>{resumen.aceptadas}</strong>
              </article>

              <article className="panel-prestador-indicador">
                <span>Finalizadas</span>
                <strong>{resumen.finalizadas}</strong>
              </article>
            </div>

            <section
              className="panel-prestador-actividad"
              aria-labelledby="panel-actividad-titulo"
            >
              <div className="panel-prestador-titulo-seccion">
                <div>
                  <h2 id="panel-actividad-titulo">
                    Actividad reciente
                  </h2>
                  <p>Las últimas solicitudes recibidas.</p>
                </div>

                <Link to="/prestador/solicitudes">
                  Ver todas
                </Link>
              </div>

              {recientes.length === 0 ? (
                <p className="panel-prestador-vacio">
                  Todavía no recibiste solicitudes.
                </p>
              ) : (
                <ul className="panel-prestador-lista">
                  {recientes.map((solicitud, indice) => (
                    <li
                      key={solicitud.id ?? `solicitud-${indice}`}
                      className="panel-prestador-actividad-item"
                    >
                      <div>
                        <strong>
                          {obtenerNombreServicio(solicitud)}
                        </strong>
                        <p>
                          Solicitud #{solicitud.id ?? 'Sin número'}
                        </p>
                      </div>

                      <span className="panel-prestador-estado">
                        {obtenerEtiquetaEstado(solicitud.estado)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </section>

      <section
        className="panel-prestador-seccion"
        aria-labelledby="panel-accesos-titulo"
      >
        <div className="panel-prestador-titulo-seccion">
          <div>
            <h2 id="panel-accesos-titulo">
              Accesos rápidos
            </h2>
            <p>Administrá tu cuenta y tus servicios.</p>
          </div>
        </div>

        <nav
          className="panel-prestador-accesos"
          aria-label="Opciones del prestador"
        >
          <Link
            className="panel-prestador-acceso"
            to="/prestador/solicitudes"
          >
            <span className="panel-prestador-acceso-icono">
              📋
            </span>
            <strong>Solicitudes recibidas</strong>
            <span>
              Consultá y gestioná los trabajos solicitados.
            </span>
          </Link>

          <Link
            className="panel-prestador-acceso"
            to="/prestador/perfil"
          >
            <span className="panel-prestador-acceso-icono">
              👤
            </span>
            <strong>Mi perfil</strong>
            <span>
              Revisá y actualizá tu información.
            </span>
          </Link>

          <Link
            className="panel-prestador-acceso"
            to="/prestador/oficios"
          >
            <span className="panel-prestador-acceso-icono">
              🛠️
            </span>
            <strong>Mis oficios</strong>
            <span>
              Administrá los servicios que ofrecés.
            </span>
          </Link>
        </nav>
      </section>
    </main>
  )
}

export default PanelPrestador
