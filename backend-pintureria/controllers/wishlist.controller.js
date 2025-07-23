// backend-pintureria/controllers/wishlist.controller.js
import db from '../db.js';
import logger from '../logger.js';

/**
 * Obtiene la lista de deseos de un usuario.
 */
export const getWishlist = async (req, res, next) => {
  const { userId } = req.user;
  try {
    const query = `
      SELECT p.id, p.name, p.brand, p.price, p.image_url as "imageUrl", p.stock
      FROM wishlist_items wi
      JOIN products p ON wi.product_id = p.id
      WHERE wi.user_id = $1 AND p.is_active = true
      ORDER BY wi.created_at DESC;
    `;
    const result = await db.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    logger.error(`Error fetching wishlist for user ${userId}:`, error);
    next(error);
  }
};

/**
 * Añade un producto a la lista de deseos de un usuario.
 */
export const addToWishlist = async (req, res, next) => {
  const { userId } = req.user;
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ message: 'Product ID is required.' });
  }

  try {
    // Usamos ON CONFLICT DO NOTHING para evitar errores si el item ya existe.
    const query = `
      INSERT INTO wishlist_items (user_id, product_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, product_id) DO NOTHING
      RETURNING *;
    `;
    const result = await db.query(query, [userId, productId]);
    
    if (result.rowCount > 0) {
        logger.info(`Product ${productId} added to wishlist for user ${userId}`);
        res.status(201).json({ message: 'Producto añadido a la lista de deseos.', item: result.rows[0] });
    } else {
        res.status(200).json({ message: 'El producto ya estaba en la lista de deseos.' });
    }
  } catch (error) {
    logger.error(`Error adding product ${productId} to wishlist for user ${userId}:`, error);
    next(error);
  }
};

/**
 * Elimina un producto de la lista de deseos de un usuario.
 */
export const removeFromWishlist = async (req, res, next) => {
  const { userId } = req.user;
  const { productId } = req.params;

  try {
    const query = `
      DELETE FROM wishlist_items
      WHERE user_id = $1 AND product_id = $2;
    `;
    const result = await db.query(query, [userId, productId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'El producto no se encontró en la lista de deseos.' });
    }
    
    logger.info(`Product ${productId} removed from wishlist for user ${userId}`);
    res.status(200).json({ message: 'Producto eliminado de la lista de deseos.' });
  } catch (error) {
    logger.error(`Error removing product ${productId} from wishlist for user ${userId}:`, error);
    next(error);
  }
};
