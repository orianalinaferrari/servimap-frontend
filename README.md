# ServiMap frontend

React/Vite con identidad visual ServiMap y mapa MapLibre + OpenFreeMap Liberty.

```sh
npm install
npm run dev -- --port 5173 --strictPort
npm test
npm run lint
npm run build
```

Copiar `.env.example` a `.env.local` y conservar `VITE_API_URL` como origen de la API, sin `/api` al final. Guardar el archivo en UTF-8 sin BOM. No agregar credenciales ni JWT a Git.

- [Contratos, configuración, diferencias y validación del backend](docs/integracion-backend.md)
- [Proveedor cartográfico, condiciones y revisión del mapa](docs/mapa-prestadores.md)

Las pruebas bloquean HTTP real no simulado. La API publicada permite actualmente el origen de desarrollo `http://localhost:5173`; otros orígenes requieren autorización CORS del responsable del backend. No se usa un proxy para eludir esa restricción.
