import { useContext, useState } from 'react'
import { AuthContext } from '../../context/authContextInstance'
import { normalizarRol, ROLES } from '../../utils/roles'
import { FormularioCuenta } from './FormularioCuenta'

function EditorNombre({ usuario, guardar, deshabilitado, onCambiarEdicion }) {
  const [editando, setEditando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  function cambiarEdicion(valor) { setEditando(valor); onCambiarEdicion?.(valor) }
  return <section aria-label="Edición del nombre de usuario">
    {mensaje && <p role="status">{mensaje}</p>}
    {editando ? <FormularioCuenta usuario={usuario} onGuardar={guardar}
      onCancelar={() => cambiarEdicion(false)}
      onConfirmado={() => { cambiarEdicion(false); setMensaje('Nombre actualizado en el servidor.') }} />
      : <div className="prestador-acciones"><button type="button" disabled={deshabilitado}
        onClick={() => { setMensaje(''); cambiarEdicion(true) }}>Editar nombre</button></div>}
  </section>
}

export default function EdicionNombreUsuario({ deshabilitado = false, onCambiarEdicion }) {
  const auth = useContext(AuthContext)
  // La edición requiere la operación del proveedor autenticado, no un guardado local.
  if (!auth?.usuario?.id || typeof auth.actualizarNombre !== 'function' ||
      ![ROLES.CLIENTE, ROLES.PRESTADOR].includes(normalizarRol(auth.usuario.rol))) return null
  return <EditorNombre key={`${auth.claveSesion ?? 0}:${auth.usuario.id}:${auth.usuario.rol}`}
    usuario={auth.usuario} guardar={auth.actualizarNombre} deshabilitado={deshabilitado} onCambiarEdicion={onCambiarEdicion} />
}
