// backend-pintureria/tests/products.test.js

import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

const app = express();
app.use(express.json());

// --- Mock del módulo de base de datos ---
const mockDb = {
  query: jest.fn(),
};

// --- Mock de datos de productos ---
const mockProductsData = [
  { id: 1, name: 'Látex Interior Mate', brand: 'Alba', price: 15000, image_url: 'url1', average_rating: 4.5, review_count: 10 },
  { id: 2, name: 'Esmalte Sintético Brillante', brand: 'Sherwin', price: 12500, image_url: 'url2', average_rating: 4.0, review_count: 5 },
];

// --- Rutas de productos simuladas para la prueba ---
app.get('/api/products', async (req, res) => {
  try {
    // Simulamos la respuesta de la base de datos
    mockDb.query.mockResolvedValue({ rows: mockProductsData });
    const result = await mockDb.query('SELECT * FROM products...');
    
    // Mapeamos los datos como lo hace tu servidor real
    const products = result.rows.map(p => ({ 
      ...p, 
      imageUrl: p.image_url, 
      oldPrice: p.old_price,
      averageRating: parseFloat(p.average_rating),
      reviewCount: parseInt(p.review_count, 10)
    }));

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.get('/api/products/:productId', async (req, res) => {
    const { productId } = req.params;
    const product = mockProductsData.find(p => p.id === parseInt(productId));

    if (product) {
        mockDb.query.mockResolvedValue({ rows: [product] });
        const result = await mockDb.query('SELECT * FROM products WHERE id = $1', [productId]);
        res.json(result.rows[0]);
    } else {
        res.status(404).json({ message: 'Producto no encontrado' });
    }
});


// --- Suite de Pruebas de Productos ---
describe('Endpoints de Productos', () => {

  beforeEach(() => {
    mockDb.query.mockClear();
  });

  // --- Prueba 1: Obtener todos los productos ---
  test('GET /api/products - debería devolver una lista de productos', async () => {
    const response = await request(app).get('/api/products');

    expect(response.statusCode).toBe(200);
    // Verificamos que la respuesta sea un array
    expect(Array.isArray(response.body)).toBe(true);
    // Verificamos que la cantidad de productos sea la correcta
    expect(response.body.length).toBe(2);
    // Verificamos que el primer producto tenga el nombre esperado
    expect(response.body[0].name).toBe('Látex Interior Mate');
  });

  // --- Prueba 2: Obtener un producto por su ID ---
  test('GET /api/products/:productId - debería devolver un producto específico', async () => {
    const response = await request(app).get('/api/products/1');

    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe('Látex Interior Mate');
    expect(mockDb.query).toHaveBeenCalledWith('SELECT * FROM products WHERE id = $1', ['1']);
  });

  // --- Prueba 3: Intentar obtener un producto que no existe ---
  test('GET /api/products/:productId - debería devolver error 404 si el producto no existe', async () => {
    const response = await request(app).get('/api/products/99');

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('Producto no encontrado');
  });
});
