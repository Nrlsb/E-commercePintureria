// backend-pintureria/middlewares/validators.js
import { body, param, query, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = errors.array().map(err => ({
    field: err.path,
    message: err.msg,
  }));
  return res.status(400).json({ errors: extractedErrors });
};

export const registerRules = () => [
  body('email').isEmail().withMessage('Debe ser un correo electrónico válido.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
  body('firstName').notEmpty().withMessage('El nombre es requerido.').trim().escape(),
  body('lastName').notEmpty().withMessage('El apellido es requerido.').trim().escape(),
  body('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('El número de teléfono no es válido.').trim().escape(),
];

export const loginRules = () => [
  body('email').isEmail().withMessage('Debe ser un correo electrónico válido.').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es requerida.'),
];

// --- CAMBIO: Se añade la validación para el campo 'dni' ---
export const updateProfileRules = () => [
  body('firstName').optional({ checkFalsy: true }).trim().escape(),
  body('lastName').optional({ checkFalsy: true }).trim().escape(),
  body('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('El número de teléfono no es válido.').trim().escape(),
  body('dni')
    .optional({ checkFalsy: true })
    .isNumeric().withMessage('El DNI debe contener solo números.')
    .isLength({ min: 7, max: 8 }).withMessage('El DNI debe tener entre 7 y 8 dígitos.')
    .trim().escape(),
];

export const addressRules = () => [
  body('address_line1').notEmpty().withMessage('La línea de dirección 1 es requerida.').trim().escape(),
  body('address_line2').optional({ checkFalsy: true }).trim().escape(),
  body('city').notEmpty().withMessage('La ciudad es requerida.').trim().escape(),
  body('state').notEmpty().withMessage('La provincia es requerida.').trim().escape(),
  body('postal_code').notEmpty().withMessage('El código postal es requerido.').isAlphanumeric().trim().escape(),
  body('is_default').optional().isBoolean().toBoolean(),
];

export const productRules = () => [
  body('name').notEmpty().withMessage('El nombre es requerido.').trim().escape(),
  body('brand').notEmpty().withMessage('La marca es requerida.').trim().escape(),
  body('category').notEmpty().withMessage('La categoría es requerida.').trim().escape(),
  body('price').isFloat({ gt: 0 }).withMessage('El precio debe ser un número positivo.'),
  body('stock').isInt({ min: 0 }).withMessage('El stock debe ser un número entero no negativo.'),
  body('description').notEmpty().withMessage('La descripción es requerida.').trim().escape(),
  body('old_price').optional({ checkFalsy: true }).isFloat({ gt: 0 }).withMessage('El precio anterior debe ser un número positivo.'),
  body('image_url').optional({ checkFalsy: true }).custom(value => {
      try {
        const parsed = JSON.parse(value);
        if (parsed.small && !/^https?:\/\/.+/.test(parsed.small)) throw new Error('URL inválida.');
        if (parsed.medium && !/^https?:\/\/.+/.test(parsed.medium)) throw new Error('URL inválida.');
        if (parsed.large && !/^https?:\/\/.+/.test(parsed.large)) throw new Error('URL inválida.');
        return true;
      } catch (e) {
        if (!/^https?:\/\/.+/.test(value)) {
          throw new Error('La URL de la imagen no es válida.');
        }
        return true;
      }
    }).withMessage('La URL de la imagen o su formato no es válido.'),
];

export const reviewRules = () => [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('La calificación debe ser un número entre 1 y 5.'),
  body('comment').optional({ checkFalsy: true }).isLength({ max: 500 }).trim().escape(),
];

export const shippingCalculationRules = () => [
  body('postalCode').notEmpty().isPostalCode('any').trim().escape(),
  body('items').isArray({ min: 1 }).withMessage('La lista de items no puede estar vacía.'),
];

export const couponRules = () => [
  body('code').notEmpty().isLength({ min: 3, max: 20 }).isAlphanumeric().toUpperCase().trim().escape(),
  body('description').optional({ checkFalsy: true }).isLength({ max: 200 }).trim().escape(),
  body('discount_type').isIn(['percentage', 'fixed']),
  body('discount_value').isFloat({ gt: 0 }),
  body('min_purchase_amount').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body('usage_limit').optional({ checkFalsy: true }).isInt({ min: 1 }),
  body('expires_at').optional({ checkFalsy: true }).isISO8601().toDate(),
  body('is_active').optional().isBoolean().toBoolean(),
];

export const validateCouponRules = () => [
  body('code').notEmpty().isLength({ min: 3, max: 20 }).isAlphanumeric().toUpperCase().trim().escape(),
  body('subtotal').isFloat({ gt: 0 }),
];

export const productQueryParamsRules = () => [
  query('searchQuery').optional({ checkFalsy: true }).isLength({ max: 100 }).trim().escape(),
  query('category').optional({ checkFalsy: true }).isLength({ max: 50 }).trim().escape(),
  query('sortBy').optional({ checkFalsy: true }).isIn(['price_asc', 'price_desc', 'rating_desc']),
  query('brands').optional({ checkFalsy: true }).customSanitizer(value => typeof value === 'string' ? value.split(',').map(brand => escape(brand.trim())) : value),
  query('minPrice').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  query('maxPrice').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  query('page').optional({ checkFalsy: true }).isInt({ min: 1 }),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 100 }),
];

export const orderQueryParamsRules = () => [
  query('status').optional({ checkFalsy: true }).isIn(['approved', 'pending_transfer', 'pending', 'cancelled']).trim().escape(),
  query('search').optional({ checkFalsy: true }).isLength({ max: 100 }).trim().escape(),
  query('page').optional({ checkFalsy: true }).isInt({ min: 1 }),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 50 }),
];
