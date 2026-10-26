
export function VistaPerfilPrestador({ perfil, onEditar }) {
  const oficios = perfil.oficios
    .split(',')
    .map((oficio) => oficio.trim())
    .filter(Boolean)

  return (
    <section aria-labelledby="titulo-perfil">
      <h2 id="titulo-perfil">Mi perfil de prestador</h2>

      <p>
        <strong>Nombre completo:</strong>{' '}
        {perfil.nombre} {perfil.apellido}
      </p>

      <p>
        <strong>Teléfono:</strong>{' '}
        {perfil.telefono || 'No informado'}
      </p>

      <p>
        <strong>Correo electrónico:</strong>{' '}
        {perfil.email || 'No informado'}
      </p>

      <p>
        <strong>Ubicación:</strong>{' '}
        {perfil.ubicacion || 'No informada'}
      </p>

      <h3>Oficios ofrecidos</h3>

      {oficios.length > 0 ? (
        <ul>
          {oficios.map((oficio) => (
            <li key={oficio}>{oficio}</li>
          ))}
        </ul>
      ) : (
        <p>No hay oficios registrados.</p>
      )}

      <h3>Descripción profesional</h3>
      <p>{perfil.descripcion || 'Sin descripción.'}</p>

      <button type="button" onClick={onEditar}>
        Editar perfil
      </button>
    </section>
  )
}

