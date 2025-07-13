// src/tests/setup.js

// Este archivo se ejecuta antes de cada suite de pruebas.
// Es el lugar ideal para configurar el entorno de pruebas o extender funcionalidades.

import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Añade los matchers de jest-dom (como .toBeInTheDocument(), .toHaveClass(), etc.)
// a la función `expect` de Vitest. Esto nos da más herramientas para verificar
// el estado de nuestros componentes en el DOM virtual.
expect.extend(matchers);
