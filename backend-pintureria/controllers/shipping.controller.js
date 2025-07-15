// backend-pintureria/controllers/shipping.controller.js
import { getShippingCost } from '../services/shippingService.js';

export const calculateShipping = async (req, res, next) => { // Añadimos 'next' para el manejo de errores
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
    // Pasamos el error al middleware centralizado (si lo implementas)
    // o lo manejamos aquí directamente.
    console.error('Error en el controlador de cálculo de envío:', error);
    res.status(500).json({ message: error.message || 'Error interno al calcular el envío.' });
  }
};
