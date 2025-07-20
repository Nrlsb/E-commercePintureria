// backend-pintureria/services/auth.service.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db.js';
import { sendPasswordResetEmail } from '../emailService.js';
import logger from '../logger.js';
import config from '../config/index.js'; // Importamos la configuración

// Usamos el secreto JWT desde el objeto de configuración
const JWT_SECRET = config.jwtSecret;

// ... (el resto del código del servicio de autenticación no necesita cambios)
/**
 * Registra un nuevo usuario en la base de datos.
 * @param {object} userData - Datos del usuario (email, password, firstName, lastName, phone).
 * @returns {Promise<object>} El usuario creado.
 */
export const register = async (userData) => {
  const { email, password, firstName, lastName, phone } = userData;
  if (!email || !password || !firstName || !lastName) {
    const error = new Error('Nombre, apellido, email y contraseña son requeridos.');
    error.statusCode = 400;
    throw error;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const result = await db.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, email',
      [email, passwordHash, firstName, lastName, phone]
    );
    logger.info(`Usuario registrado con éxito: ${result.rows[0].email}`);
    return result.rows[0];
  } catch (err) {
    if (err.code === '23505') {
      const error = new Error('El email ya está registrado.');
      error.statusCode = 409;
      throw error;
    }
    throw err;
  }
};

/**
 * Autentica a un usuario y devuelve un token JWT.
 * @param {string} email - Email del usuario.
 * @param {string} password - Contraseña del usuario.
 * @returns {Promise<object>} Objeto con el token y los datos del usuario.
 */
export const login = async (email, password) => {
  if (!email || !password) {
    const error = new Error('Email y contraseña son requeridos.');
    error.statusCode = 400;
    throw error;
  }

  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  if (!user) {
    const error = new Error('Credenciales inválidas.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const error = new Error('Credenciales inválidas.');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  logger.info(`Inicio de sesión exitoso para el usuario: ${user.email}`);
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
    },
  };
};

/**
 * Inicia el proceso de reseteo de contraseña.
 * @param {string} email - Email del usuario.
 * @returns {Promise<string>} Mensaje de confirmación.
 */
export const forgotPassword = async (email) => {
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return 'Si el correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña.';
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hora

    await db.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3',
      [hashedToken, passwordResetExpires, email]
    );

    await sendPasswordResetEmail(email, resetToken);
    return 'Se ha enviado un correo para restablecer la contraseña.';
};

/**
 * Resetea la contraseña de un usuario usando un token.
 * @param {string} token - El token de reseteo.
 * @param {string} password - La nueva contraseña.
 * @returns {Promise<string>} Mensaje de confirmación.
 */
export const resetPassword = async (token, password) => {
    if (!password || password.length < 6) {
        const error = new Error('La contraseña debe tener al menos 6 caracteres.');
        error.statusCode = 400;
        throw error;
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const userResult = await db.query(
      'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
      [hashedToken]
    );

    if (userResult.rows.length === 0) {
        const error = new Error('El token es inválido o ha expirado.');
        error.statusCode = 400;
        throw error;
    }

    const user = userResult.rows[0];
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await db.query(
      'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
      [passwordHash, user.id]
    );
    
    logger.info(`Contraseña actualizada para el usuario: ${user.email}`);
    return 'Contraseña actualizada con éxito.';
};
