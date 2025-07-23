// backend-pintureria/controllers/coupons.controller.js
import db from '../db.js';
import logger from '../logger.js';

// --- CRUD para Administradores ---

export const createCoupon = async (req, res, next) => {
    const { code, discount_type, discount_value, expires_at, min_purchase_amount, usage_limit, description } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO coupons (code, discount_type, discount_value, expires_at, min_purchase_amount, usage_limit, description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [code.toUpperCase(), discount_type, discount_value, expires_at, min_purchase_amount, usage_limit, description]
        );
        logger.info(`Nuevo cupón creado: ${code.toUpperCase()}`);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') { // Error de unicidad
            return res.status(409).json({ message: 'El código de cupón ya existe.' });
        }
        next(error);
    }
};

export const getAllCoupons = async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM coupons ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

export const updateCoupon = async (req, res, next) => {
    const { id } = req.params;
    const { code, discount_type, discount_value, expires_at, is_active, min_purchase_amount, usage_limit, description } = req.body;
    try {
        const result = await db.query(
            'UPDATE coupons SET code = $1, discount_type = $2, discount_value = $3, expires_at = $4, is_active = $5, min_purchase_amount = $6, usage_limit = $7, description = $8 WHERE id = $9 RETURNING *',
            [code.toUpperCase(), discount_type, discount_value, expires_at, is_active, min_purchase_amount, usage_limit, description, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Cupón no encontrado.' });
        }
        logger.info(`Cupón actualizado: ${code.toUpperCase()}`);
        res.json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'El código de cupón ya existe.' });
        }
        next(error);
    }
};

export const deleteCoupon = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM coupons WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Cupón no encontrado.' });
        }
        logger.info(`Cupón eliminado con ID: ${id}`);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};


// --- Validación para Clientes ---

export const validateCoupon = async (req, res, next) => {
  const { code, subtotal } = req.body;
  const { userId } = req.user;

  if (!code) {
    return res.status(400).json({ message: 'El código del cupón es requerido.' });
  }

  try {
    const couponResult = await db.query(
      `SELECT * FROM coupons 
       WHERE code = $1 AND is_active = true AND (expires_at IS NULL OR expires_at > NOW())`,
      [code.toUpperCase()]
    );

    if (couponResult.rows.length === 0) {
      return res.status(404).json({ message: 'El cupón no es válido o ha expirado.' });
    }

    const coupon = couponResult.rows[0];

    // 1. Verificar monto mínimo de compra
    if (coupon.min_purchase_amount > 0 && subtotal < coupon.min_purchase_amount) {
        return res.status(400).json({ message: `Esta compra no alcanza el monto mínimo de $${coupon.min_purchase_amount} para usar este cupón.` });
    }

    // 2. Verificar límite de uso total
    if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
        return res.status(400).json({ message: 'Este cupón ha alcanzado su límite de usos.' });
    }

    // 3. Verificar si el usuario ya usó este cupón (límite de 1 por usuario)
    const usageResult = await db.query('SELECT id FROM coupon_usage WHERE coupon_id = $1 AND user_id = $2', [coupon.id, userId]);
    if (usageResult.rows.length > 0) {
        return res.status(400).json({ message: 'Ya has utilizado este cupón.' });
    }

    logger.info(`Cupón '${code}' validado exitosamente para el usuario ID: ${userId}`);
    res.status(200).json({
      message: 'Cupón aplicado con éxito.',
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: parseFloat(coupon.discount_value),
      },
    });

  } catch (error) {
    next(error);
  }
};
