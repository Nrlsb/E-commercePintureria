// backend-pintureria/controllers/shipping.controller.js

/**
 * Simula una llamada a una API externa de envíos (ej. Correo Argentino)
 * para cotizar el costo basado en el código postal y el peso total.
 * @param {string} postalCode - Código postal de destino.
 * @param {number} totalWeightKg - Peso total del carrito en kilogramos.
 * @returns {Promise<number>} - El costo de envío calculado.
 */
const calculateShippingFromApi = async (postalCode, totalWeightKg) => {
  console.log(`Simulating shipping cost calculation for postal code: ${postalCode} and weight: ${totalWeightKg}kg`);

  // Lógica de cálculo simulada:
  // - Un costo base.
  // - Un costo adicional por kilogramo.
  // - Un factor basado en la región (simulado por el primer dígito del CP).
  const baseCost = 500; // Costo base de envío
  const costPerKg = 150; // Costo adicional por cada kg

  const regionDigit = parseInt(postalCode.charAt(0), 10);
  let regionFactor = 1.0; // Factor para CABA/GBA

  if (regionDigit >= 2 && regionDigit <= 5) {
    regionFactor = 1.2; // Centro del país
  } else if (regionDigit >= 6 && regionDigit <= 8) {
    regionFactor = 1.4; // Norte y Litoral
  } else if (regionDigit === 9) {
    regionFactor = 1.6; // Patagonia
  }

  const weightCost = totalWeightKg * costPerKg;
  const totalShippingCost = (baseCost + weightCost) * regionFactor;

  // Simular un pequeño retraso de red
  await new Promise(resolve => setTimeout(resolve, 300));

  return Math.round(totalShippingCost);
};

export const calculateShipping = async (req, res) => {
  const { postalCode, items } = req.body;

  if (!postalCode || !/^\d{4}$/.test(postalCode)) {
    return res.status(400).json({ message: 'Se requiere un código postal válido de 4 dígitos.' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'La lista de items no puede estar vacía.' });
  }

  try {
    // Simulamos que cada producto pesa 2.5kg para el cálculo.
    // En una implementación real, el peso debería venir de la base de datos.
    const totalWeightKg = items.reduce((total, item) => total + (item.quantity * 2.5), 0);

    const shippingCost = await calculateShippingFromApi(postalCode, totalWeightKg);

    res.json({ postalCode, cost: shippingCost });

  } catch (error) {
    console.error('Error al calcular el costo de envío:', error);
    res.status(500).json({ message: 'Error interno al calcular el envío.' });
  }
};
