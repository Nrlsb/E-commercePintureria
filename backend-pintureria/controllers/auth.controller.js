// backend-pintureria/controllers/auth.controller.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db.js';
import { sendPasswordResetEmail } from '../emailService.js';
import logger from '../logger.js';

// Usar variables de entorno separadas para mayor seguridad
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';

export const registerUser = async (req, res, next) => {
  const { email, password, firstName, lastName, phone } = req.body;
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: 'Nombre, apellido, email y contraseña son requeridos.' });
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const result = await db.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, email',
      [email, passwordHash, firstName, lastName, phone]
    );
    logger.info(`Usuario registrado con éxito: ${result.rows[0].email}`);
    res.status(201).json({ message: 'Usuario registrado con éxito', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
        return res.status(409).json({ message: 'El email ya está registrado.' });
    }
    next(err);
  }
};

export const loginUser = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
    }
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        const userPayload = { 
            userId: user.id, 
            email: user.email, 
            role: user.role,
            firstName: user.first_name,
            lastName: user.last_name
        };

        const accessToken = jwt.sign(userPayload, JWT_ACCESS_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

        await db.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/', // <-- Añadir path
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
        });
        
        logger.info(`Inicio de sesión exitoso para el usuario: ${user.email}`);
        
        res.json({ 
            accessToken, 
            user: { 
                id: user.id, 
                email: user.email, 
                role: user.role, 
                firstName: user.first_name, 
                lastName: user.last_name 
            } 
        });
    } catch (err) {
        next(err);
    }
};

export const refreshToken = async (req, res, next) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);

    const refreshToken = cookies.jwt;

    try {
        const userResult = await db.query('SELECT * FROM users WHERE refresh_token = $1', [refreshToken]);
        if (userResult.rows.length === 0) {
            return res.sendStatus(403);
        }
        const user = userResult.rows[0];

        jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, decoded) => {
            if (err || user.id !== decoded.userId) return res.sendStatus(403);

            const userPayload = { 
                userId: user.id, 
                email: user.email, 
                role: user.role,
                firstName: user.first_name,
                lastName: user.last_name
            };
            const accessToken = jwt.sign(userPayload, JWT_ACCESS_SECRET, { expiresIn: '15m' });
            res.json({ accessToken, user: userPayload });
        });
    } catch (err) {
        next(err);
    }
};

export const logoutUser = async (req, res, next) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204);

    const refreshToken = cookies.jwt;

    try {
        await db.query('UPDATE users SET refresh_token = NULL WHERE refresh_token = $1', [refreshToken]);
        
        // --- MEJORA: Añadir las mismas opciones que al crear la cookie ---
        res.clearCookie('jwt', { 
            httpOnly: true, 
            sameSite: 'strict', 
            secure: process.env.NODE_ENV === 'production',
            path: '/' 
        });
        res.sendStatus(204);
    } catch (err) {
        next(err);
    }
};


export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(200).json({ message: 'Si el correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hora

    await db.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3',
      [hashedToken, passwordResetExpires, email]
    );

    try {
      await sendPasswordResetEmail(email, resetToken);
      res.status(200).json({ message: 'Se ha enviado un correo para restablecer la contraseña.' });
    } catch (emailError) {
      logger.error('Error específico del servicio de email:', emailError.message);
      next(new Error('Error interno del servidor al intentar enviar el correo.'));
    }

  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const userResult = await db.query(
      'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
      [hashedToken]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'El token es inválido o ha expirado.' });
    }

    const user = userResult.rows[0];

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await db.query(
      'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
      [passwordHash, user.id]
    );
    
    logger.info(`Contraseña actualizada para el usuario: ${user.email}`);
    res.status(200).json({ message: 'Contraseña actualizada con éxito.' });

  } catch (error) {
    next(error);
  }
};
