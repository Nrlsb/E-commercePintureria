// backend-pintureria/controllers/auth.controller.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db.js';
import { sendPasswordResetEmail } from '../emailService.js';
import logger from '../logger.js';

const JWT_SECRET = process.env.JWT_SECRET;

// ... (registerUser, forgotPassword, resetPassword permanecen igual)
export const registerUser = async (req, res, next) => {
  const { email, password, firstName, lastName, phone } = req.body;
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

        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role,
                firstName: user.first_name,
                lastName: user.last_name
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        // 1. Configurar la cookie
        res.cookie('token', token, {
            httpOnly: true, // La cookie no es accesible por JavaScript
            secure: process.env.NODE_ENV === 'production', // Solo se envía sobre HTTPS en producción
            sameSite: 'strict', // Mitiga ataques CSRF
            maxAge: 60 * 60 * 1000, // 1 hora de expiración
        });

        logger.info(`Inicio de sesión exitoso para el usuario: ${user.email}`);
        
        // 2. Enviar solo la información del usuario en la respuesta
        res.json({ 
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

// 3. NUEVA FUNCIÓN: Logout
export const logoutUser = (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Sesión cerrada exitosamente.' });
};

// 4. NUEVA FUNCIÓN: Verificar sesión
export const getMe = (req, res) => {
    // El middleware authenticateToken ya ha verificado el token y puesto req.user
    const { userId, email, role, firstName, lastName } = req.user;
    res.json({
        user: {
            id: userId,
            email,
            role,
            firstName,
            lastName
        }
    });
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
