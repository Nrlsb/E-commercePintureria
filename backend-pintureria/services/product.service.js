// backend-pintureria/services/product.service.js
import db from '../db.js';
import redisClient from '../redisClient.js';
import logger from '../logger.js';
import AppError from '../utils/AppError.js'; // Importar AppError (aunque no se use directamente para lanzar, es bueno tenerlo)

const CACHE_EXPIRATION = 3600; // 1 hora en segundos

// --- Helper para parsear la URL de la imagen ---
const parseImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (typeof imageUrl === 'object') return imageUrl;
  try {
    if (imageUrl.startsWith('{') && imageUrl.endsWith('}')) {
      return JSON.parse(imageUrl);
    }
  } catch (e) {
    // Ignora el error y continúa
  }
  return { small: imageUrl, medium: imageUrl, large: imageUrl };
};

// --- NUEVO: Función para limpiar la caché de marcas ---
const BRANDS_CACHE_KEY = 'product_brands';

export const clearBrandsCache = async () => {
  try {
    if (redisClient.isReady) {
      await redisClient.del(BRANDS_CACHE_KEY);
      logger.info('Caché de marcas de productos invalidada.');
    }
  } catch (err) {
    logger.error('Error al invalidar la caché de marcas:', err);
  }
};

// --- NUEVO: Servicio para obtener marcas de productos con caché y logging de caché ---
export const fetchProductBrands = async () => {
  try {
    if (redisClient.isReady) {
      const cachedData = await redisClient.get(BRANDS_CACHE_KEY);
      if (cachedData) {
        logger.debug(`Cache HIT: Marcas de productos`); // Log de cache hit
        return JSON.parse(cachedData);
      }
    }
  } catch (err) {
    logger.error('Error al leer la caché de marcas de Redis:', err);
    // No lanzar error aquí, solo loggear, para que la app pueda seguir funcionando sin caché
  }

  logger.debug(`Cache MISS: Marcas de productos. Consultando base de datos.`); // Log de cache miss
  try {
    // Query is static, no user input involved, so it's safe.
    const result = await db.query('SELECT DISTINCT brand FROM products WHERE is_active = true ORDER BY brand ASC');
    const brands = result.rows.map(row => row.brand);

    if (redisClient.isReady) {
      await redisClient.setEx(BRANDS_CACHE_KEY, CACHE_EXPIRATION, JSON.stringify(brands));
    }
    return brands;
  } catch (err) {
    logger.error('Error al obtener marcas de la base de datos:', err);
    throw err; // Propagar el error
  }
};


// --- Función para limpiar la caché de productos (ya existente) ---
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

// --- NUEVO: Servicio para obtener sugerencias de búsqueda (ya existente) ---
export const fetchProductSuggestions = async (query) => {
  if (!query || query.trim().length < 2) {
    return { products: [], categories: [], brands: [] };
  }

  const searchTerm = `%${query.trim()}%`;

  try {
    // Using parameterized queries for all search suggestions
    const productsQuery = db.query(
      'SELECT id, name, image_url as "imageUrl" FROM products WHERE name ILIKE $1 AND is_active = true LIMIT 5',
      [searchTerm]
    );

    const categoriesQuery = db.query(
      'SELECT DISTINCT category FROM products WHERE category ILIKE $1 AND is_active = true LIMIT 3',
      [searchTerm]
    );

    const brandsQuery = db.query(
      'SELECT DISTINCT brand FROM products WHERE brand ILIKE $1 AND is_active = true LIMIT 3',
      [searchTerm]
    );

    const [productsResult, categoriesResult, brandsResult] = await Promise.all([
      productsQuery,
      categoriesQuery,
      brandsQuery,
    ]);

    // Parseamos las imágenes de los productos sugeridos
    const products = productsResult.rows.map(p => ({
      ...p,
      imageUrl: parseImageUrl(p.imageUrl)?.small || 'https://placehold.co/40x40'
    }));
    
    const categories = categoriesResult.rows.map(r => r.category);
    const brands = brandsResult.rows.map(r => r.brand);

    return { products, categories, brands };
  } catch (error) {
    logger.error('Error fetching search suggestions:', error);
    throw error; // Propagar el error
  }
};


export const getActiveProducts = async (filters) => {
  const cacheKey = `products:${JSON.stringify(filters)}`;

  try {
    if (redisClient.isReady) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        logger.debug(`Cache HIT: Lista de productos para filtros ${JSON.stringify(filters)}`); // Log de cache hit
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
    // No lanzar error aquí, solo loggear, para que la app pueda seguir funcionando sin caché
  }

  logger.debug(`Cache MISS: Lista de productos para filtros ${JSON.stringify(filters)}. Consultando base de datos.`); // Log de cache miss
  const { category, sortBy, brands, minPrice, maxPrice, page = 1, limit = 12, searchQuery } = filters;
  const queryParams = [];
  let whereClauses = ['p.is_active = true'];
  let paramIndex = 1;

  // Using parameterized queries for all dynamic parts of the WHERE clause
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
  
  // Using parameterized query for count
  const countQuery = `SELECT COUNT(*) FROM products p ${whereString}`;
  try {
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
    // Using parameterized query for LIMIT and OFFSET
    baseQuery += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(limit, offset);

    const result = await db.query(baseQuery, queryParams);
    
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
        await redisClient.setEx(cacheKey, CACHE_EXPIRATION, JSON.stringify(responseData));
      }
    } catch (err) {
      logger.error('Error al escribir en la caché de Redis:', err);
    }

    return responseData;
  } catch (err) {
    logger.error('Error al obtener productos de la base de datos:', err);
    throw err; // Propagar el error
  }
};

export const getActiveProductById = async (productId) => {
  const cacheKey = `product:${productId}`;

  try {
    if (redisClient.isReady) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        logger.debug(`Cache HIT: Producto ${productId}`); // Log de cache hit
        const parsedProduct = JSON.parse(cachedData);
        parsedProduct.imageUrl = parseImageUrl(parsedProduct.imageUrl);
        return parsedProduct;
      }
    }
  } catch (err) {
    logger.error('Error al leer de la caché de Redis:', err);
    // No lanzar error aquí, solo loggear, para que la app pueda seguir funcionando sin caché
  }

  logger.debug(`Cache MISS: Producto ${productId}. Consultando base de datos.`); // Log de cache miss
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
  // Using parameterized query to prevent SQL Injection
  try {
    const result = await db.query(query, [productId]);
    
    if (!result.rows[0]) {
      return null;
    }
    
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
  } catch (err) {
    logger.error('Error al obtener el producto por ID de la base de datos:', err);
    throw err; // Propagar el error
  }
};
