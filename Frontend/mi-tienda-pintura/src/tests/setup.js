import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { act } from '@testing-library/react';

// Importa jest-dom para extender `expect` con los matchers de DOM.
// Este import realiza la configuración automáticamente al ser importado.
import '@testing-library/jest-dom';

// Ya no es necesario importar 'expect' ni 'matchers', ni llamar a 'expect.extend()'.

// Limpia el DOM después de cada test para evitar tests "sucios".
afterEach(() => {
  cleanup();
});

// --- Mockeo Global de Zustand ---
// Esta sección se encarga de que los stores de Zustand se reinicien
// entre cada test, para que no interfieran entre sí.

const storeResetFns = new Set();

// Mockeamos la librería 'zustand' para interceptar su creación.
vi.mock('zustand', async (importOriginal) => {
  const originalModule = await importOriginal();
  const { create: actualCreate } = originalModule;

  // Sobreescribimos la función 'create' de zustand.
  const create = (createState) => {
    const store = actualCreate(createState);
    const initialState = store.getState();
    // Guardamos una función para poder resetear este store a su estado inicial.
    storeResetFns.add(() => store.setState(initialState, true));
    return store;
  };

  return {
    ...originalModule,
    create,
  };
});

// Mockeamos el middleware 'persist' para que no haga nada durante los tests.
// Esto evita que intente guardar en localStorage o sessionStorage.
vi.mock('zustand/middleware', async (importOriginal) => {
    const originalModule = await importOriginal();
    return {
        ...originalModule,
        persist: (config) => config,
    };
});

// Después de cada test, reseteamos todos los stores que se hayan creado.
afterEach(() => {
  act(() => {
    storeResetFns.forEach((reset) => reset());
  });
});
