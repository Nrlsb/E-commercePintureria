import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // Importamos el módulo crypto
import db from '../db.js';
import { sendPasswordResetEmail } from '../emailService.js'; // Importamos el nuevo servicio de email

const JWT_SECRET = process.env.JWT_SECRET;

export const registerUser = async (req, res) => {
  // ... (código existente sin cambios)
};

export const loginUser = async (req, res) => {
    // ... (código existente sin cambios)
};

/**
 * --- NUEVO CONTROLADOR ---
 * Maneja la solicitud de restablecimiento de contraseña.
 */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      // No revelamos si el email existe o no por seguridad.
      return res.status(200).json({ message: 'Si el correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña.' });
    }

    // Generar un token seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Establecer fecha de expiración (1 hora desde ahora)
    const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hora

    // Guardar el token hasheado y la fecha de expiración en la base de datos
    await db.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3',
      [hashedToken, passwordResetExpires, email]
    );

    // Enviar el email con el token original (no el hasheado)
    await sendPasswordResetEmail(email, resetToken);

    res.status(200).json({ message: 'Se ha enviado un correo para restablecer la contraseña.' });

  } catch (error) {
    console.error('Error en forgotPassword:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

/**
 * --- NUEVO CONTROLADOR ---
 * Restablece la contraseña del usuario usando un token válido.
 */
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  // Hashear el token recibido para compararlo con el de la BD
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  try {
    // Buscar al usuario por el token y verificar que no haya expirado
    const userResult = await db.query(
      'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
      [hashedToken]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'El token es inválido o ha expirado.' });
    }

    const user = userResult.rows[0];

    // Hashear la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Actualizar la contraseña y limpiar los campos de reseteo
    await db.query(
      'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
      [passwordHash, user.id]
    );

    res.status(200).json({ message: 'Contraseña actualizada con éxito.' });

  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};
