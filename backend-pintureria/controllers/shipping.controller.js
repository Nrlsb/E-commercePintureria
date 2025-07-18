// backend-pintureria/controllers/shipping.controller.js
import { getShippingCost } from '../services/shippingService.js';
import logger from '../logger.js';

export const calculateShipping = async (req, res, next) => {
  const { postalCode, items } = req.body;

  if (!postalCode || !/^\d{4}$/.test(postalCode)) {
    return res.status(400).json({ message: 'Se requiere un código postal válido de 4 dígitos.' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'La lista de items no puede estar vacía.' });
  }

  try {
    const shippingCost = await getShippingCost({ postalCode, items });
    res.json({ postalCode, cost: shippingCost });
  } catch (error) {
    next(error);
  }
};
