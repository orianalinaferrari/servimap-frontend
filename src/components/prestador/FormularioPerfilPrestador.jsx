import { useState } from 'react'

export function FormularioPerfilPrestador({ perfil, onGuardar, onCancelar }) {
  const [datos, setDatos] = useState({ ...perfil })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const campos = [
    ['zonaCobertura', 'Zona de cobertura', 'text'], ['descripcionProfesional', 'Descripción profesional', 'textarea'],
    ['telefono', 'Teléfono', 'tel'], ['whatsapp', 'WhatsApp', 'tel'], ['emailContacto', 'Email de contacto', 'email'], ['fotoPerfil', 'URL de foto de perfil', 'text'],
    ['precioMin', 'Precio mínimo', 'number'], ['precioMax', 'Precio máximo', 'number'],
    ['latitud', 'Latitud privada', 'number'], ['longitud', 'Longitud privada', 'number'],
  ]
  async function enviar(evento) {
    evento.preventDefault()
    if (enviando) return
    setError('')
    const payload = {}
    for (const [name, label, type] of campos) {
      const valor = datos[name] ?? ''
      if (type === 'number') {
        if (valor === '') continue
        const numero = Number(valor)
        if (!Number.isFinite(numero) || (name.startsWith('precio') && numero < 0) || (name === 'latitud' && Math.abs(numero) > 90) || (name === 'longitud' && Math.abs(numero) > 180)) {
          setError('Revisá los precios y las coordenadas.'); return
        }
        payload[name] = numero
      } else {
        const texto = String(valor).trim()
        // Estos campos son opcionales, pero el backend rechaza su valor vacío
        // si aparecen en el PUT. No convertir un null inicial en una escritura inválida.
        if (['descripcionProfesional', 'telefono', 'whatsapp', 'emailContacto'].includes(name) && !texto) {
          if (String(perfil[name] ?? '').trim()) {
            setError(`${label} no puede quedar vacío. El servidor no permite borrar este dato.`)
            return
          }
          continue
        }
        if (['telefono', 'whatsapp'].includes(name) && !/^\+?\d[\d\s()-]{5,19}$/.test(texto)) {
          setError(`${label} debe tener un formato telefónico válido.`)
          return
        }
        payload[name] = texto
      }
    }
    payload.disponible = Boolean(datos.disponible)
    if (payload.precioMin != null && payload.precioMax != null && payload.precioMin > payload.precioMax) { setError('El precio mínimo no puede superar al máximo.'); return }
    setEnviando(true)
    try { await onGuardar(payload) } catch (fallo) { setError(fallo.message) } finally { setEnviando(false) }
  }
  return <form onSubmit={enviar}>
    <h2>Editar mi perfil</h2>
    <p>Nombre y email de la cuenta: {perfil.nombre} · {perfil.email}</p>
    <p>Las coordenadas exactas son privadas. En el mapa público se muestran redondeadas. Los campos numéricos vacíos conservan su valor anterior.</p>
    {campos.map(([name, label, type]) => {
      const Campo = type === 'textarea' ? 'textarea' : 'input'
      return <div key={name}><label htmlFor={name}>{label}</label><Campo id={name} type={type === 'textarea' ? undefined : type} step={type === 'number' ? 'any' : undefined} value={datos[name] ?? ''} onChange={(evento) => setDatos((previos) => ({ ...previos, [name]: evento.target.value }))} disabled={enviando} /></div>
    })}
    <label><input type="checkbox" checked={Boolean(datos.disponible)} onChange={(evento) => setDatos((previos) => ({ ...previos, disponible: evento.target.checked }))} disabled={enviando} /> Disponible para recibir solicitudes</label>
    {error && <p role="alert">{error}</p>}
    <button type="submit" disabled={enviando}>{enviando ? 'Guardando...' : 'Guardar cambios'}</button>
    <button type="button" onClick={onCancelar} disabled={enviando}>Cancelar</button>
  </form>
}
