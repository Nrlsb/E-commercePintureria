// backend-pintureria/services/product.service.js
import db from '../db.js';
import redisClient from '../redisClient.js';
import logger from '../logger.js';

const CACHE_EXPIRATION = 3600; // 1 hora en segundos

// --- NUEVO: Helper para parsear la URL de la imagen ---
// Intenta parsear un string JSON. Si falla o no es un JSON, lo trata como una URL de tamaño mediano.
const parseImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (typeof imageUrl === 'object') return imageUrl; // Ya es un objeto
  try {
    // Verifica si es un string que parece un objeto JSON
    if (imageUrl.startsWith('{') && imageUrl.endsWith('}')) {
      return JSON.parse(imageUrl);
    }
  } catch (e) {
    // Ignora el error de parseo y continúa
  }
  // Si no es un JSON válido o es una URL simple, lo devuelve en el formato esperado
  return { small: imageUrl, medium: imageUrl, large: imageUrl };
};

export const getActiveProducts = async (filters) => {
  const cacheKey = `products:${JSON.stringify(filters)}`;

  try {
    if (redisClient.isReady) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        logger.debug(`Cache HIT para la clave: ${cacheKey}`);
        // Parseamos los datos recuperados de la caché
        const parsedCache = JSON.parse(cachedData);
        parsedCache.products = parsedCache.products.map(p => ({
          ...p,
          imageUrl: parseImageUrl(p.imageUrl)
        }));
        return parsedCache;
      }
    }
  } catch (err) {
    logger.error('Error al leer de la caché de Redis:', err);
  }

  logger.debug(`Cache MISS para la clave: ${cacheKey}. Consultando base de datos.`);
  // ... (lógica de construcción de query sin cambios) ...
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
  
  // --- MODIFICADO: Parseamos el campo imageUrl para cada producto ---
  const productsWithParsedImages = result.rows.map(p => ({
    ...p,
    imageUrl: parseImageUrl(p.imageUrl)
  }));

  const responseData = {
    products: productsWithParsedImages,
    currentPage: parseInt(page, 10),
    totalPages,
    totalProducts,
  };

  try {
    if (redisClient.isReady) {
      // Guardamos en caché la respuesta ya procesada (con el objeto de imagen)
      await redisClient.setEx(cacheKey, CACHE_EXPIRATION, JSON.stringify(responseData));
    }
  } catch (err) {
    logger.error('Error al escribir en la caché de Redis:', err);
  }

  return responseData;
};

export const getActiveProductById = async (productId) => {
  const cacheKey = `product:${productId}`;

  try {
    if (redisClient.isReady) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        logger.debug(`Cache HIT para la clave: ${cacheKey}`);
        const parsedProduct = JSON.parse(cachedData);
        parsedProduct.imageUrl = parseImageUrl(parsedProduct.imageUrl);
        return parsedProduct;
      }
    }
  } catch (err) {
    logger.error('Error al leer de la caché de Redis:', err);
  }

  logger.debug(`Cache MISS para la clave: ${cacheKey}. Consultando base de datos.`);
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
  
  if (!result.rows[0]) {
    return null;
  }
  
  // --- MODIFICADO: Parseamos el campo imageUrl ---
  const product = {
    ...result.rows[0],
    imageUrl: parseImageUrl(result.rows[0].imageUrl)
  };

  try {
    if (redisClient.isReady) {
      await redisClient.setEx(cacheKey, CACHE_EXPIRATION, JSON.stringify(product));
    }
  } catch (err) {
    logger.error('Error al escribir en la caché de Redis:', err);
  }

  return product;
};
