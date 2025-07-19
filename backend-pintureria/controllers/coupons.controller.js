// backend-pintureria/controllers/coupons.controller.js
import db from '../db.js';
import logger from '../logger.js';

/**
 * Valida un código de cupón.
 * Verifica si existe, si está activo y si no ha expirado.
 */
export const validateCoupon = async (req, res, next) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'El código del cupón es requerido.' });
  }

  try {
    const query = `
      SELECT * FROM coupons 
      WHERE code = $1 AND is_active = true AND (expires_at IS NULL OR expires_at > NOW())
    `;
    const result = await db.query(query, [code.toUpperCase()]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'El cupón no es válido o ha expirado.' });
    }

    const coupon = result.rows[0];
    logger.info(`Cupón '${code}' validado exitosamente para el usuario ID: ${req.user.userId}`);
    res.status(200).json({
      message: 'Cupón aplicado con éxito.',
      coupon: {
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: parseFloat(coupon.discount_value),
      },
    });

  } catch (error) {
    next(error);
  }
};
