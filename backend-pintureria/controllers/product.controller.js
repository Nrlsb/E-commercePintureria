// backend-pintureria/controllers/product.controller.js
import db from '../db.js';
import logger from '../logger.js';
import * as productService from '../services/product.service.js';
import redisClient from '../redisClient.js';
import AppError from '../utils/AppError.js'; // Importar AppError
import fetch from 'node-fetch';
import config from '../config/index.js';

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
      throw new AppError('Producto no encontrado o no está activo.', 404);
    }
  } catch (err) {
    next(err);
  }
};

export const getProductBrands = async (req, res, next) => {
  try {
    const brands = await productService.fetchProductBrands();
    res.json(brands);
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  const { name, brand, category, price, old_price, image_url, description, stock, seo_title, seo_meta_description } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO products (name, brand, category, price, old_price, image_url, description, stock, seo_title, seo_meta_description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [name, brand, category, price, old_price, image_url, description, stock, seo_title, seo_meta_description]
    );
    logger.info(`Producto creado con ID: ${result.rows[0].id}`);
    await clearProductsCache();
    await clearBrandsCache();
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  const { id } = req.params;
  const { name, brand, category, price, old_price, image_url, description, stock, seo_title, seo_meta_description } = req.body;
  try {
    const result = await db.query(
      'UPDATE products SET name = $1, brand = $2, category = $3, price = $4, old_price = $5, image_url = $6, description = $7, stock = $8, seo_title = $9, seo_meta_description = $10 WHERE id = $11 RETURNING *',
      [name, brand, category, price, old_price, image_url, description, stock, seo_title, seo_meta_description, id]
    );
    if (result.rows.length === 0) {
      throw new AppError('Producto no encontrado.', 404);
    }
    logger.info(`Producto actualizado con ID: ${id}`);
    await clearProductsCache();
    if (redisClient.isReady) {
      await redisClient.del(`product:${id}`);
    }
    await clearBrandsCache();
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
      throw new AppError('Producto no encontrado.', 404);
    }
    
    logger.info(`Producto DESACTIVADO con ID: ${id}`);
    await clearProductsCache();
    if (redisClient.isReady) {
      await redisClient.del(`product:${id}`);
    }
    await clearBrandsCache();
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
    if (redisClient.isReady) {
      await redisClient.del(`product:${productId}`);
    }
    await clearProductsCache();
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { 
      throw new AppError('Ya has enviado una reseña para este producto.', 409);
    }
    next(err);
  }
};

export const deleteReview = async (req, res, next) => {
  const { reviewId } = req.params;
  const { userId, role } = req.user;

  try {
    const reviewResult = await db.query('SELECT user_id, product_id FROM reviews WHERE id = $1', [reviewId]);
    
    if (reviewResult.rows.length === 0) {
      throw new AppError('Reseña no encontrada.', 404);
    }

    const review = reviewResult.rows[0];

    if (review.user_id !== userId && role !== 'admin') {
      throw new AppError('No tienes permiso para eliminar esta reseña.', 403);
    }

    await db.query('DELETE FROM reviews WHERE id = $1', [reviewId]);
    logger.info(`Reseña ID: ${reviewId} eliminada por el usuario ID: ${userId}`);
    if (redisClient.isReady) {
      await redisClient.del(`product:${review.product_id}`);
    }
    await clearProductsCache();
    res.status(204).send();

  } catch (err) {
    next(err);
  }
};

export const getProductSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    const suggestions = await productService.fetchProductSuggestions(q);
    res.json(suggestions);
  } catch (err) {
    next(err);
  }
};

export const getComplementaryProducts = async (req, res, next) => {
    const { cartItems } = req.body;
    const apiKey = config.geminiApiKey;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return res.json([]);
    }
    if (!apiKey) {
        return next(new AppError('La clave de API de Gemini no está configurada.', 500));
    }

    try {
        const allProductsResult = await db.query(
            `SELECT id, name, category, brand, description FROM products WHERE is_active = true`
        );
        const allProducts = allProductsResult.rows;

        const cartProductNames = cartItems.map(item => `- ${item.name} (Categoría: ${item.category})`).join('\n');
        const allProductsContext = allProducts.map(p => `{"id": ${p.id}, "name": "${p.name}", "category": "${p.category}"}`).join(',\n');
        const cartProductIds = new Set(cartItems.map(item => item.id));

        const prompt = `
            Eres un asistente experto en una pinturería. Un cliente tiene los siguientes productos en su carrito de compras:
            --- Carrito del Cliente ---
            ${cartProductNames}
            ---

            Basado en estos productos, recomienda 4 productos complementarios de la siguiente lista de productos disponibles en la tienda.
            No recomiendes productos que ya están en el carrito.
            Prioriza productos de la categoría "Accesorios" si es relevante (pinceles, rodillos, cintas, etc.).
            Devuelve tu respuesta únicamente como un objeto JSON válido que contenga una sola clave llamada "recommendations", cuyo valor sea un array de los IDs de los productos recomendados. Por ejemplo: {"recommendations": [12, 45, 102, 8]}.

            --- Catálogo de Productos Disponibles (JSON) ---
            [
            ${allProductsContext}
            ]
            ---
        `;

        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            logger.error("Error from Gemini API for recommendations:", errorBody);
            throw new AppError('No se pudieron obtener recomendaciones de la IA.', apiResponse.status);
        }

        const result = await apiResponse.json();
        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!responseText) {
            return res.json([]);
        }

        const recommendedIds = JSON.parse(responseText).recommendations;

        if (!recommendedIds || recommendedIds.length === 0) {
            return res.json([]);
        }

        const finalIds = recommendedIds.filter(id => !cartProductIds.has(id));

        if (finalIds.length === 0) {
            return res.json([]);
        }
        
        const recommendedProductsResult = await productService.getProductsByIds(finalIds);
        
        res.json(recommendedProductsResult);

    } catch (err) {
        next(err);
    }
};
