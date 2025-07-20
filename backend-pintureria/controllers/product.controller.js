// backend-pintureria/controllers/product.controller.js
import db from '../db.js';
import logger from '../logger.js';
import * as productService from '../services/product.service.js';

// --- Controladores de Productos ---

export const getProducts = async (req, res, next) => {
  try {
    const result = await productService.getActiveProducts(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (req, res, next) => {
  const { productId } = req.params;
  try {
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

// --- El resto de los controladores (create, update, delete, reviews) permanecen aquí por ahora ---
// --- ya que la lógica está muy ligada a la base de datos y al request. ---
// --- Se podrían mover a servicios si la lógica de negocio crece. ---

export const getProductBrands = async (req, res, next) => {
  try {
    const result = await db.query('SELECT DISTINCT brand FROM products WHERE is_active = true ORDER BY brand ASC');
    const brands = result.rows.map(row => row.brand);
    res.json(brands);
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  const { name, brand, category, price, old_price, image_url, description, stock } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO products (name, brand, category, price, old_price, image_url, description, stock) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [name, brand, category, price, old_price, image_url, description, stock]
    );
    logger.info(`Producto creado con ID: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  const { id } = req.params;
  const { name, brand, category, price, old_price, image_url, description, stock } = req.body;
  try {
    const result = await db.query(
      'UPDATE products SET name = $1, brand = $2, category = $3, price = $4, old_price = $5, image_url = $6, description = $7, stock = $8 WHERE id = $9 RETURNING *',
      [name, brand, category, price, old_price, image_url, description, stock, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    logger.info(`Producto actualizado con ID: ${id}`);
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      'UPDATE products SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    logger.info(`Producto DESACTIVADO con ID: ${id}`);
    res.status(200).json({ message: 'Producto desactivado con éxito' });
  } catch (err) {
    next(err);
  }
};

export const getProductReviews = async (req, res, next) => {
  const { productId } = req.params;
  try {
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
    const query = `
      INSERT INTO reviews (rating, comment, product_id, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await db.query(query, [rating, comment, productId, userId]);
    logger.info(`Nueva reseña creada para el producto ID: ${productId} por el usuario ID: ${userId}`);
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
    const reviewResult = await db.query('SELECT user_id FROM reviews WHERE id = $1', [reviewId]);
    
    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ message: 'Reseña no encontrada.' });
    }

    const review = reviewResult.rows[0];

    if (review.user_id !== userId && role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar esta reseña.' });
    }

    await db.query('DELETE FROM reviews WHERE id = $1', [reviewId]);
    logger.info(`Reseña ID: ${reviewId} eliminada por el usuario ID: ${userId}`);
    res.status(204).send();

  } catch (err) {
    next(err);
  }
};
