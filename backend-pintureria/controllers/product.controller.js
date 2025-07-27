// backend-pintureria/controllers/product.controller.js
import db from '../db.js';
import logger from '../logger.js';
import * as productService from '../services/product.service.js';
import redisClient from '../redisClient.js';

// --- Función para limpiar la caché de productos ---
const clearProductsCache = async () => {
  try {
    if (redisClient.isReady) {
      const keys = await redisClient.keys('products:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
        logger.info('Caché de lista de productos invalidada.');
      }
    }
  } catch (err) {
    logger.error('Error al invalidar la caché de productos:', err);
  }
};

// --- NUEVO: Función para limpiar la caché de marcas ---
const clearBrandsCache = async () => {
  try {
    if (redisClient.isReady) {
      await redisClient.del('product_brands');
      logger.info('Caché de marcas de productos invalidada.');
    }
  } catch (err) {
    logger.error('Error al invalidar la caché de marcas:', err);
  }
};


// --- Controladores de Productos (Existentes) ---

export const getProducts = async (req, res, next) => {
  try {
    // productService.getActiveProducts already handles parameterized queries
    const result = await productService.getActiveProducts(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (req, res, next) => {
  const { productId } = req.params;
  try {
    // productService.getActiveProductById already handles parameterized queries
    const product = await productService.getActiveProductById(productId);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Producto no encontrado o no está activo.' });
    }
  } catch (err) {
    next(err);
  }
};

// --- MODIFICADO: Ahora usa el servicio con caché ---
export const getProductBrands = async (req, res, next) => {
  try {
    // productService.fetchProductBrands already handles parameterized queries
    const brands = await productService.fetchProductBrands();
    res.json(brands);
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  const { name, brand, category, price, old_price, image_url, description, stock } = req.body;
  try {
    // La sanitización de 'name', 'brand', 'category', 'description' se realiza en el middleware 'validators.js'
    const result = await db.query(
      'INSERT INTO products (name, brand, category, price, old_price, image_url, description, stock) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [name, brand, category, price, old_price, image_url, description, stock]
    );
    logger.info(`Producto creado con ID: ${result.rows[0].id}`);
    await clearProductsCache(); // Invalidar caché de listas de productos
    await clearBrandsCache(); // Invalidar caché de marcas (por si se añadió una nueva marca)
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  const { id } = req.params;
  const { name, brand, category, price, old_price, image_url, description, stock } = req.body;
  try {
    // La sanitización de 'name', 'brand', 'category', 'description' se realiza en el middleware 'validators.js'
    const result = await db.query(
      'UPDATE products SET name = $1, brand = $2, category = $3, price = $4, old_price = $5, image_url = $6, description = $7, stock = $8 WHERE id = $9 RETURNING *',
      [name, brand, category, price, old_price, image_url, description, stock, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    logger.info(`Producto actualizado con ID: ${id}`);
    await clearProductsCache(); // Invalidar caché de listas de productos
    if (redisClient.isReady) {
      await redisClient.del(`product:${id}`); // Invalidar caché del producto específico
    }
    await clearBrandsCache(); // Invalidar caché de marcas (por si la marca cambió)
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req, res, next) => {
  const { id } = req.params;
  try {
    // Using parameterized query to prevent SQL Injection (soft delete)
    const result = await db.query(
      'UPDATE products SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    logger.info(`Producto DESACTIVADO con ID: ${id}`);
    await clearProductsCache(); // Invalidar caché de listas de productos
    if (redisClient.isReady) {
      await redisClient.del(`product:${id}`); // Invalidar caché del producto específico
    }
    await clearBrandsCache(); // Invalidar caché de marcas (por si la marca del producto desactivado era la única)
    res.status(200).json({ message: 'Producto desactivado con éxito' });
  } catch (err) {
    next(err);
  }
};

export const getProductReviews = async (req, res, next) => {
  const { productId } = req.params;
  try {
    // Using parameterized query to prevent SQL Injection
    const query = `
      SELECT r.*, u.first_name, u.last_name 
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC;
    `;
    const result = await db.query(query, [productId]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

export const createProductReview = async (req, res, next) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.userId;

  try {
    // La sanitización de 'comment' se realiza en el middleware 'validators.js'
    const query = `
      INSERT INTO reviews (rating, comment, product_id, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await db.query(query, [rating, comment, productId, userId]);
    logger.info(`Nueva reseña creada para el producto ID: ${productId} por el usuario ID: ${userId}`);
    // Invalidate specific product cache as its reviews changed
    if (redisClient.isReady) {
      await redisClient.del(`product:${productId}`);
    }
    await clearProductsCache(); // Could also affect average rating in listings
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { 
      return res.status(409).json({ message: 'Ya has enviado una reseña para este producto.' });
    }
    next(err);
  }
};

export const deleteReview = async (req, res, next) => {
  const { reviewId } = req.params;
  const { userId, role } = req.user;

  try {
    // Using parameterized query
    const reviewResult = await db.query('SELECT user_id, product_id FROM reviews WHERE id = $1', [reviewId]);
    
    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ message: 'Reseña no encontrada.' });
    }

    const review = reviewResult.rows[0];

    if (review.user_id !== userId && role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar esta reseña.' });
    }

    // Using parameterized query
    await db.query('DELETE FROM reviews WHERE id = $1', [reviewId]);
    logger.info(`Reseña ID: ${reviewId} eliminada por el usuario ID: ${userId}`);
    // Invalidate affected product cache
    if (redisClient.isReady) {
      await redisClient.del(`product:${review.product_id}`);
    }
    await clearProductsCache(); // Could also affect average rating in listings
    res.status(204).send();

  } catch (err) {
    next(err);
  }
};

// --- NUEVO: Controlador para obtener sugerencias de búsqueda (ya existente, solo se mueve) ---
export const getProductSuggestions = async (req, res, next) => {
  try {
    // productService.fetchProductSuggestions already handles parameterized queries
    const { q } = req.query;
    const suggestions = await productService.fetchProductSuggestions(q);
    res.json(suggestions);
  } catch (err) {
    next(err);
  }
};
