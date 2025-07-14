// cypress.config.js
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // La URL donde corre tu aplicación de Vite en desarrollo.
    baseUrl: 'http://localhost:5173',
    
    // --- CAMBIO CLAVE: Se desactiva la búsqueda del archivo de soporte ---
    // Esto le indica a Cypress que no intente cargar un archivo `e2e.js`,
    // solucionando el error de configuración.
    supportFile: false,

    setupNodeEvents(on, config) {
      // Aquí se pueden implementar listeners de eventos de nodo si es necesario.
    },
  },
});
