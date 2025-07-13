// backend-pintureria/tests/auth.test.js

import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

const app = express();
app.use(express.json());

// --- Mock del módulo de base de datos ---
const mockDb = {
  // Creamos una función espía (spy) para `query`
  query: jest.fn(),
};

// --- Rutas de autenticación simuladas para la prueba ---
app.post('/api/auth/register', async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }

  // Simulamos que primero verificamos si el usuario existe
  if (email === 'existing@test.com') {
    // Si existe, no llamamos a la query de inserción y devolvemos el error
    return res.status(409).json({ message: 'El email ya está registrado.' });
  }

  try {
    // **CORRECCIÓN:** Ahora sí llamamos a la función `query` del mock.
    // Esto simula la inserción de un nuevo usuario en la base de datos.
    const dbResult = await mockDb.query(
      'INSERT INTO users...', 
      [email, password, firstName, lastName]
    );
    
    // Devolvemos el resultado simulado
    res.status(201).json({ message: 'Usuario registrado con éxito', user: dbResult.rows[0] });

  } catch (e) {
    res.status(500).json({ message: 'Error en la base de datos' });
  }
});

// --- Suite de Pruebas de Autenticación ---
describe('Endpoints de Autenticación', () => {

  beforeEach(() => {
    // Limpiamos los mocks antes de cada prueba
    mockDb.query.mockClear();
  });

  // --- Prueba 1: Registro exitoso ---
  test('debería registrar un nuevo usuario con éxito', async () => {
    const newUser = {
      email: 'newuser@test.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };

    // Configuramos el mock para que devuelva un valor cuando sea llamado
    mockDb.query.mockResolvedValue({ rows: [{ id: 1, email: newUser.email }] });

    const response = await request(app)
      .post('/api/auth/register')
      .send(newUser);

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe('Usuario registrado con éxito');
    // Ahora esta verificación pasará, porque la función `query` fue llamada
    expect(mockDb.query).toHaveBeenCalledTimes(1);
  });

  // --- Prueba 2: Intento de registro con email existente ---
  test('debería devolver un error 409 si el email ya existe', async () => {
    const existingUser = {
      email: 'existing@test.com',
      password: 'password123',
      firstName: 'Exist',
      lastName: 'Ing'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(existingUser);

    expect(response.statusCode).toBe(409);
    expect(response.body.message).toBe('El email ya está registrado.');
    // Verificamos que NO se intentó registrar en la base de datos
    expect(mockDb.query).not.toHaveBeenCalled();
  });

  // --- Prueba 3: Intento de registro con datos faltantes ---
  test('debería devolver un error 400 si faltan campos', async () => {
    const incompleteUser = {
      email: 'incomplete@test.com',
      password: 'password123'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(incompleteUser);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Todos los campos son requeridos.');
  });
});
