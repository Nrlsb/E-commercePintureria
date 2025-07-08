// backend-pintureria/server.js
import express from 'express';
import cors from 'cors';

// Importamos nuestros datos de muestra. En un futuro, esto vendrá de una base de datos.
import { mockProducts } from './data/products.js';

// Inicializamos la aplicación de Express
const app = express();
const PORT = 5001; // Usaremos un puerto diferente al del frontend

// --- Middlewares ---
// CORS: Permite que nuestro frontend (ej: en localhost:5173) se comunique con este backend.
app.use(cors()); 
// Permite a Express entender JSON en el cuerpo de las peticiones.
app.use(express.json()); 

// --- Rutas de la API (Endpoints) ---

// Ruta de prueba para verificar que el servidor funciona
app.get('/', (req, res) => {
  res.send('¡El servidor del backend de la pinturería está funcionando!');
});

// Ruta para obtener TODOS los productos
app.get('/api/products', (req, res) => {
  // Simplemente devolvemos nuestro array de productos de muestra
  res.json(mockProducts);
});

// Ruta para obtener UN SOLO producto por su ID
app.get('/api/products/:productId', (req, res) => {
  // Obtenemos el ID de los parámetros de la URL
  const { productId } = req.params;
  
  // Buscamos el producto en nuestro array
  const product = mockProducts.find(p => p.id === parseInt(productId));

  if (product) {
    res.json(product); // Si lo encontramos, lo devolvemos
  } else {
    // Si no, devolvemos un error 404 (No Encontrado)
    res.status(404).json({ message: 'Producto no encontrado' });
  }
});


// --- Iniciar el Servidor ---
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
