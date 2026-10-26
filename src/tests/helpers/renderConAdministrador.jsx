
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../../context/authContextInstance'
import App from '../../App'

export function renderConAdministrador(ruta = '/admin') {
  const usuario = {
    id: 1,
    nombre: 'Administrador de prueba',
    rol: 'ADMINISTRADOR',
  }

  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthContext.Provider
        value={{
          usuario,
          autenticado: true,
          cargando: false,
          login: async () => usuario,
          logout: async () => {},
        }}
      >
        <App />
      </AuthContext.Provider>
    </MemoryRouter>
  )
}
