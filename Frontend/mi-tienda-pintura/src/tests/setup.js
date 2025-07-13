import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Este hook se ejecuta después de cada test ('it' block).
afterEach(() => {
  // Limpia el DOM virtual para el siguiente test.
  cleanup();
  // Limpia todos los mocks de vi (spyOn, fn, etc.) para evitar que un test afecte a otro.
  vi.clearAllMocks();
});
