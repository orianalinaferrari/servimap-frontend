import { Link } from 'react-router-dom'

import { useState } from 'react'
import { validarPerfilPrestador } from '../../utils/perfilPrestador'

export function FormularioPerfilPrestador({
  perfil,
  onGuardar,
  onCancelar,
}) {
  const [datos, setDatos] = useState({ ...perfil })
  const [errores, setErrores] = useState({})

  function actualizarCampo(evento) {
    const { name, value } = evento.target

    setDatos((anterior) => ({
      ...anterior,
      [name]: value,
    }))

    setErrores((anterior) => ({
      ...anterior,
      [name]: undefined,
    }))
  }

  function guardar(evento) {
    evento.preventDefault()

    const erroresEncontrados = validarPerfilPrestador(datos)
    setErrores(erroresEncontrados)

    if (Object.keys(erroresEncontrados).length === 0) {
      onGuardar(datos)
    }
  }

  const campos = [
    { name: 'nombre', label: 'Nombre' },
    { name: 'apellido', label: 'Apellido' },
    { name: 'telefono', label: 'Teléfono' },
    { name: 'email', label: 'Correo electrónico' },
    { name: 'ubicacion', label: 'Ubicación' },
  ]

  return (
    <form onSubmit={guardar} noValidate>
      <h2>Editar mi perfil</h2>

      {campos.map(({ name, label }) => (
        <div key={name}>
          <label htmlFor={name}>{label}</label>

          <input
            id={name}
            name={name}
            type={name === 'email' ? 'email' : 'text'}
            value={datos[name]}
            onChange={actualizarCampo}
            aria-invalid={Boolean(errores[name])}
            aria-describedby={
              errores[name] ? `${name}-error` : undefined
            }
          />

          {errores[name] && (
            <p id={`${name}-error`} role="alert">
              {errores[name]}
            </p>
          )}
        </div>
      ))}

      <div>
        <h3>Oficios asociados</h3>
        <p>{datos.oficios || 'Sin oficios asociados'}</p>
        <Link to="/prestador/oficios">
          Administrar mis oficios
        </Link>
        {errores.oficios && (
          <p role="alert">{errores.oficios}</p>
        )}
      </div>

      <div>
        <label htmlFor="descripcion">
          Descripción profesional
        </label>

        <textarea
          id="descripcion"
          name="descripcion"
          value={datos.descripcion}
          onChange={actualizarCampo}
          rows={4}
        />
      </div>

      <button type="submit">Guardar cambios</button>

      <button type="button" onClick={onCancelar}>
        Cancelar
      </button>
    </form>
  )
}
