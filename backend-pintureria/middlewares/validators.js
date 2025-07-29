// backend-pintureria/middlewares/validators.js
import { body, param, query, validationResult } from 'express-validator';

/**
 * Middleware para manejar los errores de validación de express-validator.
 * Si hay errores, responde con un estado 400 y la lista de errores.
 * Si no hay errores, pasa al siguiente middleware.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  // Mapea los errores para una respuesta más limpia y consistente
  const extractedErrors = errors.array().map(err => ({
    field: err.path, // 'param' en lugar de 'path' para consistencia con la documentación
    message: err.msg,
  }));
  return res.status(400).json({ errors: extractedErrors });
};

// Reglas de validación para el registro de usuarios
export const registerRules = () => [
  body('email')
    .isEmail().withMessage('Debe ser un correo electrónico válido.')
    .normalizeEmail(), // Sanitiza el email
  body('password')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.')
    .isLength({ max: 50 }).withMessage('La contraseña no puede exceder los 50 caracteres.'),
  body('firstName')
    .notEmpty().withMessage('El nombre es requerido.')
    .isLength({ max: 50 }).withMessage('El nombre no puede exceder los 50 caracteres.')
    .trim().escape(), // Sanitiza el nombre
  body('lastName')
    .notEmpty().withMessage('El apellido es requerido.')
    .isLength({ max: 50 }).withMessage('El apellido no puede exceder los 50 caracteres.')
    .trim().escape(), // Sanitiza el apellido
  body('phone')
    .optional({ checkFalsy: true }) // Permite que sea opcional, pero si está presente, valida
    .isMobilePhone('any').withMessage('El número de teléfono no es válido.') // Valida formato de teléfono
    .isLength({ max: 20 }).withMessage('El teléfono no puede exceder los 20 caracteres.')
    .trim().escape(), // Sanitiza el teléfono
];

// Reglas de validación para el inicio de sesión
export const loginRules = () => [
  body('email')
    .isEmail().withMessage('Debe ser un correo electrónico válido.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida.'),
];

// Reglas de validación para la actualización del perfil de usuario
export const updateProfileRules = () => [
  body('firstName')
    .optional({ checkFalsy: true })
    .isLength({ max: 50 }).withMessage('El nombre no puede exceder los 50 caracteres.')
    .trim().escape(),
  body('lastName')
    .optional({ checkFalsy: true })
    .isLength({ max: 50 }).withMessage('El apellido no puede exceder los los 50 caracteres.')
    .trim().escape(),
  body('phone')
    .optional({ checkFalsy: true })
    .isMobilePhone('any').withMessage('El número de teléfono no es válido.')
    .isLength({ max: 20 }).withMessage('El teléfono no puede exceder los 20 caracteres.')
    .trim().escape(),
];

// Reglas de validación para direcciones de usuario
export const addressRules = () => [
  body('address_line1')
    .notEmpty().withMessage('La línea de dirección 1 es requerida.')
    .isLength({ max: 100 }).withMessage('La línea de dirección 1 no puede exceder los 100 caracteres.')
    .trim().escape(),
  body('address_line2')
    .optional({ checkFalsy: true })
    .isLength({ max: 100 }).withMessage('La línea de dirección 2 no puede exceder los 100 caracteres.')
    .trim().escape(),
  body('city')
    .notEmpty().withMessage('La ciudad es requerida.')
    .isLength({ max: 50 }).withMessage('La ciudad no puede exceder los 50 caracteres.')
    .trim().escape(),
  body('state')
    .notEmpty().withMessage('La provincia es requerida.')
    .isLength({ max: 50 }).withMessage('La provincia no puede exceder los 50 caracteres.')
    .trim().escape(),
  body('postal_code')
    .notEmpty().withMessage('El código postal es requerido.')
    .isLength({ min: 4, max: 10 }).withMessage('El código postal debe tener entre 4 y 10 caracteres.')
    .isAlphanumeric().withMessage('El código postal solo puede contener caracteres alfanuméricos.')
    .trim().escape(),
  body('is_default')
    .optional()
    .isBoolean().withMessage('is_default debe ser un valor booleano.')
    .toBoolean(), // Sanitiza a booleano
];

// Reglas de validación para la creación y actualización de productos
export const productRules = () => [
  body('name')
    .notEmpty().withMessage('El nombre es requerido.')
    .isLength({ max: 100 }).withMessage('El nombre no puede exceder los 100 caracteres.')
    .trim().escape(),
  body('brand')
    .notEmpty().withMessage('La marca es requerida.')
    .isLength({ max: 50 }).withMessage('La marca no puede exceder los 50 caracteres.')
    .trim().escape(),
  body('category')
    .notEmpty().withMessage('La categoría es requerida.')
    .isLength({ max: 50 }).withMessage('La categoría no puede exceder los 50 caracteres.')
    .trim().escape(),
  body('price')
    .isFloat({ gt: 0 }).withMessage('El precio debe ser un número positivo.'),
  body('stock')
    .isInt({ min: 0 }).withMessage('El stock debe ser un número entero no negativo.'),
  body('description')
    .notEmpty().withMessage('La descripción es requerida.')
    .isLength({ max: 1000 }).withMessage('La descripción no puede exceder los 1000 caracteres.')
    .trim().escape(),
  body('old_price')
    .optional({ checkFalsy: true })
    .isFloat({ gt: 0 }).withMessage('El precio anterior debe ser un número positivo.'),
  body('image_url') // Asumiendo que image_url ahora es un JSON string o un objeto en el backend
    .optional({ checkFalsy: true })
    .custom(value => {
      try {
        const parsed = JSON.parse(value);
        // Verifica si las URLs dentro del objeto son válidas
        if (parsed.small && !/^https?:\/\/.+/.test(parsed.small)) throw new Error('URL de imagen pequeña inválida.');
        if (parsed.medium && !/^https?:\/\/.+/.test(parsed.medium)) throw new Error('URL de imagen mediana inválida.');
        if (parsed.large && !/^https?:\/\/.+/.test(parsed.large)) throw new Error('URL de imagen grande inválida.');
        return true;
      } catch (e) {
        // Si no es un JSON válido o las URLs no son válidas, intenta validar como URL simple
        if (!/^https?:\/\/.+/.test(value)) {
          throw new Error('La URL de la imagen no es válida o el formato de objeto de imagen es incorrecto.');
        }
        return true;
      }
    }).withMessage('La URL de la imagen o su formato no es válido.'),
];

// Reglas de validación para crear una reseña
export const reviewRules = () => [
  body('rating')
    .isInt({ min: 1, max: 5 }).withMessage('La calificación debe ser un número entre 1 y 5.'),
  body('comment')
    .optional({ checkFalsy: true })
    .isLength({ max: 500 }).withMessage('El comentario no puede exceder los 500 caracteres.')
    .trim().escape(),
];

// Reglas de validación para el cálculo de envío
export const shippingCalculationRules = () => [
  body('postalCode')
    .notEmpty().withMessage('El código postal es requerido.')
    .isPostalCode('any').withMessage('El código postal no es válido.') // Valida formato de código postal
    .isLength({ min: 4, max: 10 }).withMessage('El código postal debe tener entre 4 y 10 caracteres.')
    .trim().escape(),
  body('items')
    .isArray({ min: 1 }).withMessage('La lista de items no puede estar vacía.')
    .custom(items => {
      for (const item of items) {
        if (!item.id || !item.quantity || !item.price || !item.name) {
          throw new Error('Cada item del carrito debe tener id, name, quantity y price.');
        }
        if (typeof item.id !== 'number' || item.id <= 0) throw new Error('ID de producto inválido en el carrito.');
        if (typeof item.quantity !== 'number' || item.quantity <= 0) throw new Error('Cantidad de producto inválida en el carrito.');
        if (typeof item.price !== 'number' || item.price < 0) throw new Error('Precio de producto inválido en el carrito.');
        // No es necesario escapar aquí, ya que estos datos provienen de la BD o son números.
      }
      return true;
    }),
];

// Reglas de validación para cupones (creación y actualización)
export const couponRules = () => [
  body('code')
    .notEmpty().withMessage('El código del cupón es requerido.')
    .isLength({ min: 3, max: 20 }).withMessage('El código debe tener entre 3 y 20 caracteres.')
    .isAlphanumeric().withMessage('El código solo puede contener letras y números.')
    .toUpperCase() // Sanitiza a mayúsculas
    .trim().escape(),
  body('description')
    .optional({ checkFalsy: true })
    .isLength({ max: 200 }).withMessage('La descripción no puede exceder los 200 caracteres.')
    .trim().escape(),
  body('discount_type')
    .isIn(['percentage', 'fixed']).withMessage('Tipo de descuento inválido.'),
  body('discount_value')
    .isFloat({ gt: 0 }).withMessage('El valor del descuento debe ser un número positivo.'),
  body('min_purchase_amount')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('El monto mínimo de compra debe ser un número no negativo.'),
  body('usage_limit')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('El límite de uso debe ser un número entero positivo.'),
  body('expires_at')
    .optional({ checkFalsy: true })
    .isISO8601().toDate().withMessage('La fecha de expiración debe ser una fecha válida (YYYY-MM-DD).'),
  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active debe ser un valor booleano.')
    .toBoolean(),
];

// Reglas de validación para la validación de un cupón por un cliente
export const validateCouponRules = () => [
  body('code')
    .notEmpty().withMessage('El código del cupón es requerido.')
    .isLength({ min: 3, max: 20 }).withMessage('El código debe tener entre 3 y 20 caracteres.')
    .isAlphanumeric().withMessage('El código solo puede contener letras y números.')
    .toUpperCase() // Sanitiza a mayúsculas
    .trim().escape(),
  body('subtotal')
    .isFloat({ gt: 0 }).withMessage('El subtotal debe ser un número positivo.'),
];

// Reglas de validación para parámetros de consulta de productos (search, category, etc.)
// Estos se aplican directamente en product.service.js, pero se pueden definir aquí si se desea centralizar.
export const productQueryParamsRules = () => [
  query('searchQuery')
    .optional({ checkFalsy: true })
    .isLength({ max: 100 }).withMessage('La consulta de búsqueda no puede exceder los 100 caracteres.')
    .trim().escape(),
  query('category')
    .optional({ checkFalsy: true })
    .isLength({ max: 50 }).withMessage('La categoría no puede exceder los 50 caracteres.')
    .trim().escape(),
  query('sortBy')
    .optional({ checkFalsy: true })
    .isIn(['price_asc', 'price_desc', 'rating_desc']).withMessage('Opción de ordenación inválida.'),
  query('brands')
    .optional({ checkFalsy: true })
    // RESALTADO: Se asegura que 'value' sea una cadena antes de procesar.
    // Se usa .map() para aplicar trim() y escape() a cada elemento de la lista.
    .customSanitizer(value => {
      if (typeof value === 'string') {
        return value.split(',').map(brand => brand.trim()).map(brand => escape(brand));
      }
      return value; // Si no es string, se devuelve el valor original (ej. undefined)
    }),
  query('minPrice')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('El precio mínimo debe ser un número no negativo.'),
  query('maxPrice')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('El precio máximo debe ser un número no negativo.'),
  query('page')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('La página debe ser un número entero positivo.'),
  query('limit')
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe ser un número entero entre 1 y 100.'),
];

// Reglas de validación para parámetros de consulta de órdenes (status, search, page, limit)
export const orderQueryParamsRules = () => [
  query('status')
    .optional({ checkFalsy: true })
    .isIn(['approved', 'pending_transfer', 'pending', 'cancelled']).withMessage('Estado de orden inválido.')
    .trim().escape(),
  query('search')
    .optional({ checkFalsy: true })
    .isLength({ max: 100 }).withMessage('La consulta de búsqueda no puede exceder los 100 caracteres.')
    .trim().escape(),
  query('page')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('La página debe ser un número entero positivo.'),
  query('limit')
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 50 }).withMessage('El límite debe ser un número entero entre 1 y 50.'),
];
