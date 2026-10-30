import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['maplibre-gl'],
  },
  test: {
    maxWorkers: 1,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}', 'scripts/**/*.mjs'],
      exclude: ['src/tests/**'],
      reporter: ['text', 'lcov', 'json-summary', 'json'],
    },
  },
})

