// backend-pintureria/middlewares/validators.js
import { body, validationResult } from 'express-validator';

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
  return res.status(400).json({ errors: errors.array() });
};

// Reglas de validación para el registro de usuarios
export const registerRules = () => [
  body('email').isEmail().withMessage('Debe ser un correo electrónico válido.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
  body('firstName').notEmpty().withMessage('El nombre es requerido.').trim().escape(),
  body('lastName').notEmpty().withMessage('El apellido es requerido.').trim().escape(),
  body('phone').optional().trim().escape(),
];

// Reglas de validación para el inicio de sesión
export const loginRules = () => [
  body('email').isEmail().withMessage('Debe ser un correo electrónico válido.').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es requerida.'),
];

// Reglas de validación para la creación y actualización de productos
export const productRules = () => [
  body('name').notEmpty().withMessage('El nombre es requerido.').trim().escape(),
  body('brand').notEmpty().withMessage('La marca es requerida.').trim().escape(),
  body('category').notEmpty().withMessage('La categoría es requerida.').trim().escape(),
  body('price').isFloat({ gt: 0 }).withMessage('El precio debe ser un número positivo.'),
  body('stock').isInt({ min: 0 }).withMessage('El stock debe ser un número entero no negativo.'),
  body('description').notEmpty().withMessage('La descripción es requerida.').trim().escape(),
  body('old_price').optional({ checkFalsy: true }).isFloat({ gt: 0 }).withMessage('El precio anterior debe ser un número positivo.'),
  body('image_url').optional({ checkFalsy: true }).isURL().withMessage('La URL de la imagen no es válida.'),
];

// Reglas de validación para crear una reseña
export const reviewRules = () => [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('La calificación debe ser un número entre 1 y 5.'),
  body('comment').optional().trim().escape(),
];
