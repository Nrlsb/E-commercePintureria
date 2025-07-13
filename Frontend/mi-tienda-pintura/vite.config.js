import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Añadimos la configuración para Vitest
  test: {
    globals: true,
    environment: 'jsdom', // Simula un entorno de navegador para las pruebas
    setupFiles: './src/tests/setup.js', // Archivo de configuración que se ejecuta antes de las pruebas
  },
})
