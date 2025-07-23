// backend-pintureria/controllers/user.controller.js
import db from '../db.js';
import logger from '../logger.js';

/**
 * Obtiene el perfil del usuario actualmente autenticado.
 */
export const getProfile = async (req, res, next) => {
  const { userId } = req.user;
  try {
    const result = await db.query(
      'SELECT id, email, first_name, last_name, phone FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    logger.error(`Error fetching profile for user ${userId}:`, error);
    next(error);
  }
};

/**
 * Actualiza el perfil del usuario actualmente autenticado.
 */
export const updateProfile = async (req, res, next) => {
  const { userId } = req.user;
  const { firstName, lastName, phone } = req.body;

  try {
    // --- CORRECCIÓN: Se elimina la asignación a la columna "updated_at" ---
    const result = await db.query(
      'UPDATE users SET first_name = $1, last_name = $2, phone = $3 WHERE id = $4 RETURNING id, email, first_name, last_name, phone',
      [firstName, lastName, phone, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    logger.info(`Profile updated for user ${userId}`);
    res.json({ message: 'Perfil actualizado con éxito.', user: result.rows[0] });
  } catch (error) {
    logger.error(`Error updating profile for user ${userId}:`, error);
    next(error);
  }
};

/**
 * Obtiene todas las direcciones de envío de un usuario.
 */
export const getAddresses = async (req, res, next) => {
    const { userId } = req.user;
    try {
        const result = await db.query('SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC', [userId]);
        res.json(result.rows);
    } catch (error) {
        logger.error(`Error fetching addresses for user ${userId}:`, error);
        next(error);
    }
};

/**
 * Añade una nueva dirección de envío para un usuario.
 */
export const addAddress = async (req, res, next) => {
    const { userId } = req.user;
    const { address_line1, address_line2, city, state, postal_code, is_default } = req.body;
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        // Si la nueva dirección es la predeterminada, quita la marca de predeterminada de las demás.
        if (is_default) {
            await client.query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [userId]);
        }
        const result = await client.query(
            'INSERT INTO user_addresses (user_id, address_line1, address_line2, city, state, postal_code, is_default) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [userId, address_line1, address_line2, city, state, postal_code, is_default]
        );
        await client.query('COMMIT');
        logger.info(`New address added for user ${userId}`);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`Error adding address for user ${userId}:`, error);
        next(error);
    } finally {
        client.release();
    }
};

/**
 * Actualiza una dirección de envío existente.
 */
export const updateAddress = async (req, res, next) => {
    const { userId } = req.user;
    const { addressId } = req.params;
    const { address_line1, address_line2, city, state, postal_code, is_default } = req.body;
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        // Si se está estableciendo como predeterminada, quita la marca de las demás.
        if (is_default) {
            await client.query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [userId]);
        }
        // --- CORRECCIÓN: Se elimina la asignación a la columna "updated_at" ---
        const result = await client.query(
            'UPDATE user_addresses SET address_line1 = $1, address_line2 = $2, city = $3, state = $4, postal_code = $5, is_default = $6 WHERE id = $7 AND user_id = $8 RETURNING *',
            [address_line1, address_line2, city, state, postal_code, is_default, addressId, userId]
        );
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Dirección no encontrada o no pertenece al usuario.' });
        }
        await client.query('COMMIT');
        logger.info(`Address ${addressId} updated for user ${userId}`);
        res.json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`Error updating address ${addressId} for user ${userId}:`, error);
        next(error);
    } finally {
        client.release();
    }
};

/**
 * Elimina una dirección de envío.
 */
export const deleteAddress = async (req, res, next) => {
    const { userId } = req.user;
    const { addressId } = req.params;
    try {
        const result = await db.query('DELETE FROM user_addresses WHERE id = $1 AND user_id = $2', [addressId, userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Dirección no encontrada o no pertenece al usuario.' });
        }
        logger.info(`Address ${addressId} deleted for user ${userId}`);
        res.status(204).send();
    } catch (error) {
        logger.error(`Error deleting address ${addressId} for user ${userId}:`, error);
        next(error);
    }
};
