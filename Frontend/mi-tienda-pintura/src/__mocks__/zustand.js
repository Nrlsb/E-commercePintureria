// src/__mocks__/zustand.js

import { create as actualCreate } from 'zustand';
import { act } from '@testing-library/react';

// Set para almacenar las funciones de reseteo de cada store
const storeResetFns = new Set();

// Mockeamos la función 'create' de Zustand
export const create = (createState) => {
  const store = actualCreate(createState);
  const initialState = store.getState();
  // Guardamos una función para resetear este store específico a su estado inicial
  storeResetFns.add(() => store.setState(initialState, true));
  return store;
};

// Hook que se ejecuta después de CADA prueba en nuestro setup.js
afterEach(() => {
  // Ejecuta todas las funciones de reseteo que hemos guardado
  act(() => {
    storeResetFns.forEach((resetFn) => resetFn());
  });
});

// Exportamos el resto de funciones de la librería original sin modificarlas
// Esto es importante para que middlewares como 'persist' sigan funcionando si los usas
const zustand = await vi.importActual('zustand');

export default zustand;
for (const key in zustand) {
  if (key !== 'create' && key !== 'default') {
    Object.defineProperty(exports, key, {
      get: () => zustand[key],
    });
  }
}
