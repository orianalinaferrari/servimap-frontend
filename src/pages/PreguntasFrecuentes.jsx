import { Link } from 'react-router-dom'
import AyudaBreve from '../components/AyudaBreve'
import '../styles/PreguntasFrecuentes.css'

const grupos = [
  {
    id: 'en-comun', titulo: 'Para clientes y prestadores', descripcion: 'Pagos y acceso a tu cuenta.',
    preguntas: [
      {
        id: 'pagos', titulo: '¿Los pagos se realizan dentro de ServiMap?',
        respuesta: <>
          <p>No. ServiMap conecta clientes y prestadores, pero no cobra ni procesa pagos. El precio final, la forma y el momento de pago se acuerdan directamente entre las partes, fuera de la plataforma.</p>
          <p>Los precios publicados son de referencia. ServiMap no gestiona reembolsos ni disputas por pagos.</p>
          <AyudaBreve etiqueta="Precio de referencia">Es el rango publicado por el prestador. No equivale a un presupuesto confirmado ni a un cobro dentro de ServiMap.</AyudaBreve>
        </>,
      },
      {
        id: 'inicio-sesion', titulo: '¿Qué hago si no puedo iniciar sesión?',
        respuesta: <>
          <p>Revisá que estés usando el email con el que te registraste y tu contraseña. Usá el botón para mostrar la contraseña si necesitás comprobar lo que escribiste. Si aparece un error de conexión, revisá tu conexión e intentá nuevamente más tarde.</p>
          <p>Si la sesión venció, volvé a iniciar sesión. Si el mensaje indica que la cuenta está desactivada, volver a ingresar los mismos datos no resuelve ese estado.</p>
          <p>ServiMap todavía no ofrece recuperación de contraseña ni reactivación de cuenta desde esta pantalla de ayuda.</p>
          <Link to="/login">Ir a iniciar sesión</Link>
        </>,
      },
    ],
  },
  {
    id: 'clientes', titulo: 'Para clientes', descripcion: 'Encontrá servicios y gestioná tus solicitudes.',
    preguntas: [
      {
        id: 'buscar', titulo: '¿Cómo busco prestadores y uso los filtros?',
        respuesta: <>
          <p>Entrá a Explorar servicios y buscá por nombre, oficio o zona. Podés combinar los filtros de oficio, zona, precio máximo, calificación mínima y Solo disponibles. Usá Limpiar filtros para empezar otra búsqueda.</p>
          <p>El filtro de precio compara tu máximo con el precio mínimo publicado por cada prestador. Los resultados sin precio informado no aparecen al aplicar ese filtro. El filtro de calificación mínima deja afuera a quienes todavía no tienen calificaciones.</p>
          <p>Abrí la ficha de un prestador para consultar sus servicios y datos de contacto. El mapa muestra ubicaciones aproximadas; un prestador sin ubicación puede aparecer en la lista sin tener un marcador.</p>
          <AyudaBreve etiqueta="Ubicación aproximada">El mapa público muestra coordenadas redondeadas, no el domicilio exacto del prestador.</AyudaBreve>
          <p><Link to="/prestadores">Explorar servicios</Link></p>
        </>,
      },
      {
        id: 'cancelar', titulo: '¿Cómo cancelo una solicitud y cuándo está permitido?',
        respuesta: <>
          <p>En Mis solicitudes de tu cuenta de cliente, elegí Preparar cancelación y luego Confirmar cancelación. Solo podés cancelar solicitudes propias en estado Pendiente o Aceptada.</p>
          <p>No se pueden cancelar solicitudes Finalizadas, Rechazadas o Canceladas. La cancelación queda registrada cuando el servidor la confirma; si otra acción cambió el estado mientras tanto, revisá el mensaje y actualizá la lista.</p>
          <Link to="/cliente/solicitudes">Ir a mis solicitudes de cliente</Link>
        </>,
      },
      {
        id: 'calificar', titulo: '¿Cuándo puedo calificar a un prestador?',
        respuesta: <>
          <p>Cuando una solicitud tuya está Finalizada y todavía no la calificaste, aparece Calificar prestador en Mis solicitudes. Podés elegir de 1 a 5 estrellas y agregar un comentario sobre tu experiencia.</p>
          <p>Solo se permite una calificación por solicitud. No podés calificar solicitudes pendientes, aceptadas, rechazadas o canceladas, ni solicitudes de otra persona.</p>
          <Link to="/cliente/solicitudes">Ver mis solicitudes para calificar</Link>
        </>,
      },
      {
        id: 'finalizado-sin-realizar', titulo: '¿Qué pasa si el prestador finaliza un trabajo que no realizó?',
        respuesta: <>
          <p>El prestador puede marcar como Finalizada una solicitud Aceptada. El sistema no pide una confirmación del cliente ni comprueba que el trabajo se haya realizado.</p>
          <p>Si te pasa, contactá al prestador mediante los datos publicados en su ficha para aclarar la situación. Podés dejar una calificación y un comentario sobre tu experiencia si aún no calificaste esa solicitud finalizada.</p>
          <p>Actualmente ServiMap no tiene un sistema de reclamos o disputas ni una función para revertir ese estado, tampoco desde el panel de administración. Una calificación no reabre la solicitud ni genera un reembolso.</p>
        </>,
      },
    ],
  },
  {
    id: 'prestadores', titulo: 'Para prestadores', descripcion: 'Respondé solicitudes y mantené tu información al día.',
    preguntas: [
      {
        id: 'responder', titulo: '¿Cómo acepto o rechazo una solicitud?',
        respuesta: <>
          <p>Desde tu panel, entrá a las solicitudes recibidas. En una solicitud Pendiente, elegí Aceptar solicitud o Rechazar solicitud y confirmá la acción. Solo podés responder solicitudes dirigidas a vos.</p>
          <p>Una vez que la solicitud está Aceptada, Rechazada, Cancelada o Finalizada, esas acciones ya no están disponibles. La respuesta queda registrada cuando el servidor la confirma.</p>
          <Link to="/prestador/solicitudes">Ir a mis solicitudes de prestador</Link>
        </>,
      },
      {
        id: 'finalizar', titulo: '¿Cuándo debo marcar un trabajo como terminado?',
        respuesta: <>
          <p>Marcá el trabajo como terminado solo después de realizarlo. En tus solicitudes recibidas, la opción está disponible para solicitudes Aceptadas y requiere que confirmes la acción.</p>
          <p>El estado pasa a Finalizada y el cliente puede calificar. No hay una función para deshacer la finalización ni una confirmación posterior del cliente. Finalizar un trabajo no registra ni confirma un pago.</p>
        </>,
      },
      {
        id: 'perfil', titulo: '¿Cómo modifico mi perfil de prestador?',
        respuesta: <>
          <p>Entrá a Mi perfil desde tu panel o tu avatar, elegí Editar perfil, revisá los datos y presioná Guardar cambios. Podés actualizar tu descripción profesional, zona, contactos, foto, precios, ubicación y disponibilidad.</p>
          <p>La foto se carga pegando la URL pública de una imagen. El nombre y el email de la cuenta se muestran como información y no se editan en ese formulario. Esperá la confirmación de guardado antes de salir.</p>
          <Link to="/prestador/perfil">Ir a mi perfil de prestador</Link>
        </>,
      },
      {
        id: 'oficios', titulo: '¿Cómo agrego o quito los oficios que ofrezco?',
        respuesta: <>
          <p>En Mis oficios, seleccioná un oficio del catálogo y pulsá Agregar oficio. Para retirarlo de tu lista, usá Quitar. Después presioná Guardar oficios: agregar o quitar en pantalla no guarda los cambios por sí solo.</p>
          <p>Solo podés asociar oficios existentes y activos del catálogo. Desde esta pantalla no se crean nuevos oficios.</p>
          <Link to="/prestador/oficios">Ir a mis oficios</Link>
        </>,
      },
    ],
  },
]

export default function PreguntasFrecuentes() {
  return (
    <main className="ayuda-pagina" aria-labelledby="ayuda-titulo">
      <header className="ayuda-cabecera">
        <p className="ayuda-antetitulo">Ayuda de ServiMap</p>
        <h1 id="ayuda-titulo">Preguntas frecuentes</h1>
        <p>Respuestas para usar ServiMap con confianza, seas cliente o prestador.</p>
      </header>

      <nav className="ayuda-temas" aria-label="Temas de ayuda">
        {grupos.map((grupo) => <a key={grupo.id} href={`#${grupo.id}`}>{grupo.titulo}</a>)}
      </nav>

      <div className="ayuda-grupos">
        {grupos.map((grupo) => (
          <section key={grupo.id} id={grupo.id} aria-labelledby={`titulo-${grupo.id}`}>
            <h2 id={`titulo-${grupo.id}`}>{grupo.titulo}</h2>
            <p>{grupo.descripcion}</p>
            <div className="ayuda-preguntas">
              {grupo.preguntas.map((pregunta) => (
                <details className="ayuda-pregunta" key={pregunta.id} id={`faq-${pregunta.id}`}>
                  <summary><h3>{pregunta.titulo}</h3><span aria-hidden="true" className="ayuda-indicador" /></summary>
                  <div className="ayuda-respuesta">{pregunta.respuesta}</div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="ayuda-cierre">Esta sección explica las funciones disponibles. No recibe reclamos ni realiza cambios en tus solicitudes o tu cuenta.</p>
    </main>
  )
}
