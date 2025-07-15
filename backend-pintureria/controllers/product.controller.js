// backend-pintureria/controllers/product.controller.js
import db from '../db.js';

// --- Controladores de Productos (sin cambios) ---
export const getProducts = async (req, res) => {
  try {
    const { category, sortBy, brands, minPrice, maxPrice, page = 1, limit = 12 } = req.query;
    const queryParams = [];
    let paramIndex = 1;
    let whereClauses = [];

    if (category) {
      whereClauses.push(`p.category = $${paramIndex++}`);
      queryParams.push(category);
    }
    if (brands) {
      const brandList = brands.split(',');
      whereClauses.push(`p.brand = ANY($${paramIndex++})`);
      queryParams.push(brandList);
    }
    if (minPrice) {
      whereClauses.push(`p.price >= $${paramIndex++}`);
      queryParams.push(minPrice);
    }
    if (maxPrice) {
      whereClauses.push(`p.price <= $${paramIndex++}`);
      queryParams.push(maxPrice);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) FROM products p ${whereString}`;
    const totalResult = await db.query(countQuery, queryParams);
    const totalProducts = parseInt(totalResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalProducts / limit);

    let baseQuery = `
      SELECT 
        p.*, 
        COALESCE(AVG(r.rating), 0) as average_rating, 
        COUNT(r.id) as review_count
      FROM products p
      LEFT JOIN reviews r ON p.id = r.product_id
      ${whereString}
      GROUP BY p.id
    `;
    
    let orderByClause = ' ORDER BY p.id ASC';
    switch (sortBy) {
      case 'price_asc':
        orderByClause = ' ORDER BY p.price ASC';
        break;
      case 'price_desc':
        orderByClause = ' ORDER BY p.price DESC';
        break;
      case 'rating_desc':
        orderByClause = ' ORDER BY average_rating DESC';
        break;
    }
    baseQuery += orderByClause;

    const offset = (page - 1) * limit;
    baseQuery += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(limit, offset);

    const result = await db.query(baseQuery, queryParams);
    
    const products = result.rows.map(p => ({ 
      ...p, 
      imageUrl: p.image_url, 
      oldPrice: p.old_price,
      averageRating: parseFloat(p.average_rating),
      reviewCount: parseInt(p.review_count, 10),
      stock: parseInt(p.stock, 10)
    }));
    
    res.json({
      products,
      currentPage: parseInt(page, 10),
      totalPages,
    });

  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getProductById = async (req, res) => {
  const { productId } = req.params;
  try {
    const query = `
      SELECT 
        p.*, 
        COALESCE(AVG(r.rating), 0) as average_rating, 
        COUNT(r.id) as review_count
      FROM products p
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE p.id = $1
      GROUP BY p.id;
    `;
    const result = await db.query(query, [productId]);
    if (result.rows.length > 0) {
      const product = result.rows[0];
      res.json({ 
        ...product, 
        imageUrl: product.image_url, 
        oldPrice: product.old_price,
        averageRating: parseFloat(product.average_rating),
        reviewCount: parseInt(product.review_count, 10),
        stock: parseInt(product.stock, 10)
      });
    } else {
      res.status(404).json({ message: 'Producto no encontrado' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// ... otros controladores de productos ...

// --- Controladores de Reseñas ---

export const getProductReviews = async (req, res) => {
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
    console.error(err);
    res.status(500).json({ message: 'Error al obtener las reseñas' });
  }
};

export const createProductReview = async (req, res) => {
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
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { 
      return res.status(409).json({ message: 'Ya has enviado una reseña para este producto.' });
    }
    res.status(500).json({ message: 'Error al crear la reseña' });
  }
};

// --- CORRECCIÓN EN deleteReview ---
export const deleteReview = async (req, res) => {
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
    
    // Se asegura de enviar una respuesta JSON vacía con status 204 (No Content)
    // que es el estándar para una eliminación exitosa sin contenido de respuesta.
    res.status(204).send();

  } catch (err) {
    console.error('Error al eliminar la reseña:', err);
    // Se asegura de que la respuesta de error también sea un JSON.
    res.status(500).json({ message: 'Error interno del servidor al eliminar la reseña.' });
  }
};
