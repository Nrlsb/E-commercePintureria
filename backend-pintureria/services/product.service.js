// backend-pintureria/services/product.service.js
import db from '../db.js';

/**
 * Obtiene una lista paginada y filtrada de productos.
 * @param {object} filters - Opciones de filtrado y ordenamiento.
 * @returns {Promise<object>} Objeto con la lista de productos y datos de paginación.
 */
export const getActiveProducts = async (filters) => {
  const { category, sortBy, brands, minPrice, maxPrice, page = 1, limit = 12, searchQuery } = filters;

  const queryParams = [];
  let whereClauses = ['p.is_active = true'];
  let paramIndex = 1;

  if (searchQuery) {
    whereClauses.push(`(p.name ILIKE $${paramIndex} OR p.brand ILIKE $${paramIndex})`);
    queryParams.push(`%${searchQuery}%`);
    paramIndex++;
  }

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

  const whereString = `WHERE ${whereClauses.join(' AND ')}`;

  const countQuery = `SELECT COUNT(*) FROM products p ${whereString}`;
  const totalResult = await db.query(countQuery, queryParams);
  const totalProducts = parseInt(totalResult.rows[0].count, 10);
  const totalPages = Math.ceil(totalProducts / limit);

  let baseQuery = `
    SELECT 
      p.id, p.name, p.brand, p.category, p.price,
      p.old_price AS "oldPrice", p.image_url AS "imageUrl",
      p.description, p.stock,
      COALESCE(AVG(r.rating), 0) as "averageRating", 
      COUNT(r.id) as "reviewCount"
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    ${whereString}
    GROUP BY p.id
  `;
  
  let orderByClause = ' ORDER BY p.id ASC';
  switch (sortBy) {
    case 'price_asc': orderByClause = ' ORDER BY p.price ASC'; break;
    case 'price_desc': orderByClause = ' ORDER BY p.price DESC'; break;
    case 'rating_desc': orderByClause = ' ORDER BY "averageRating" DESC'; break;
  }
  baseQuery += orderByClause;

  const offset = (page - 1) * limit;
  baseQuery += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  queryParams.push(limit, offset);

  const result = await db.query(baseQuery, queryParams);
  
  // --- MODIFICADO: Se añade 'totalProducts' al objeto de respuesta ---
  return {
    products: result.rows,
    currentPage: parseInt(page, 10),
    totalPages,
    totalProducts, // Devolvemos el conteo total
  };
};

/**
 * Obtiene un producto activo por su ID.
 * @param {number} productId - El ID del producto.
 * @returns {Promise<object|null>} El producto encontrado o null.
 */
export const getActiveProductById = async (productId) => {
  const query = `
    SELECT 
      p.id, p.name, p.brand, p.category, p.price,
      p.old_price AS "oldPrice", p.image_url AS "imageUrl",
      p.description, p.stock,
      COALESCE(AVG(r.rating), 0) as "averageRating", 
      COUNT(r.id) as "reviewCount"
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    WHERE p.id = $1 AND p.is_active = true
    GROUP BY p.id;
  `;
  const result = await db.query(query, [productId]);
  return result.rows[0] || null;
};
