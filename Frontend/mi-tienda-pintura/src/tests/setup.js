import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// --- LA SOLUCIÓN DEFINITIVA ---
// 1. Creamos un objeto que simula ser el localStorage.
//    Guardará los datos en memoria solo mientras duren las pruebas.
const createLocalStorage = () => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
};

// 2. Mockeamos la función `createJSONStorage` que el middleware `persist` usa internamente.
//    Le decimos que, en lugar de buscar el localStorage real del navegador,
//    use nuestro objeto falso que acabamos de crear.
vi.mock('zustand/middleware', async () => {
  const actual = await vi.importActual('zustand/middleware');
  return {
    ...actual,
    createJSONStorage: () => createLocalStorage(),
  };
});

// 3. Limpieza estándar después de cada prueba.
afterEach(() => {
  cleanup();
});
