// backend-pintureria/services/auth.service.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db.js';
import { sendPasswordResetEmail } from '../emailService.js';
import logger from '../logger.js';
import config from '../config/index.js';
import AppError from '../utils/AppError.js';

const JWT_SECRET = config.jwtSecret;

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      dni: user.dni,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

export const findOrCreateGoogleUser = async (profile) => {
  const { id: googleId, displayName, emails, name } = profile;
  const email = emails[0].value;

  try {
    let result = await db.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    let user = result.rows[0];

    if (!user) {
      result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      user = result.rows[0];

      if (user) {
        result = await db.query(
          'UPDATE users SET google_id = $1 WHERE id = $2 RETURNING *',
          [googleId, user.id]
        );
        user = result.rows[0];
        logger.info(`Usuario existente ${email} vinculado con Google ID.`);
      }
    }

    if (!user) {
      const newUserResult = await db.query(
        'INSERT INTO users (google_id, email, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING *',
        [googleId, email, name.givenName || displayName, name.familyName || '']
      );
      user = newUserResult.rows[0];
      logger.info(`Nuevo usuario creado a través de Google: ${email}`);
    }

    const token = generateToken(user);
    return { token };

  } catch (err) {
    logger.error('Error en findOrCreateGoogleUser:', err);
    throw new AppError('Error al procesar la autenticación con Google.', 500);
  }
};

export const register = async (userData) => {
  const { email, password, firstName, lastName, phone } = userData;
  if (!email || !password || !firstName || !lastName) {
    throw new AppError('Nombre, apellido, email y contraseña son requeridos.', 400);
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
      throw err; 
    }
    throw err;
  }
};

export const login = async (email, password) => {
  if (!email || !password) {
    throw new AppError('Email y contraseña son requeridos.', 400);
  }

  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  if (!user) {
    throw new AppError('Credenciales inválidas.', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AppError('Credenciales inválidas.', 401);
  }

  const token = generateToken(user);

  logger.info(`Inicio de sesión exitoso para el usuario: ${user.email}`);
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      dni: user.dni,
    },
  };
};

export const forgotPassword = async (email) => {
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return 'Si el correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña.';
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha512').update(resetToken).digest('hex');
    const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hora

    await db.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3',
      [hashedToken, passwordResetExpires, email]
    );
    
    // Log para depuración
    logger.debug(`Token generado para ${email}. Token original: ${resetToken}. Hash guardado: ${hashedToken}`);

    await sendPasswordResetEmail(email, resetToken);
    return 'Se ha enviado un correo para restablecer la contraseña.';
};

export const resetPassword = async (token, password) => {
    if (!password || password.length < 6) {
        throw new AppError('La contraseña debe tener al menos 6 caracteres.', 400);
    }

    const hashedToken = crypto.createHash('sha512').update(token).digest('hex');
    
    // Log para depuración
    logger.debug(`Intentando resetear con token: ${token}. Hash calculado: ${hashedToken}`);

    const userResult = await db.query(
      'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
      [hashedToken]
    );

    if (userResult.rows.length === 0) {
        logger.warn(`Intento de reseteo fallido. No se encontró un usuario con el hash de token proporcionado o el token ha expirado.`);
        throw new AppError('El token es inválido o ha expirado.', 400);
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

export const refreshToken = async (userId) => {
  const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  const user = result.rows[0];

  if (!user) {
    throw new AppError('Usuario no encontrado.', 404);
  }

  const newToken = generateToken(user);

  logger.info(`Token refrescado para el usuario: ${user.email}`);
  return newToken;
};
