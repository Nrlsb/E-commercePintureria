// backend-pintureria/services/shippingService.js
import fetch from 'node-fetch';
import logger from '../logger.js';

// Código postal de origen de los envíos (configurable en .env)
const ORIGIN_POSTAL_CODE = process.env.SHIPPING_API_ORIGIN_POSTAL_CODE || '3080';

/**
 * Calcula el peso total de los items del carrito.
 * En una implementación real, cada producto debería tener su peso en la BD.
 * @param {Array} items - Los items del carrito.
 * @returns {number} - El peso total en kg.
 */
const calculateTotalWeight = (items) => {
  // Simulación: asumimos que cada lata de pintura pesa 4kg.
  const DEFAULT_WEIGHT_KG = 4;
  return items.reduce((total, item) => total + (item.quantity * DEFAULT_WEIGHT_KG), 0);
};

/**
 * Obtiene el costo de envío.
 * Esta función está diseñada para ser reemplazada fácilmente por una llamada a una API real.
 * @param {object} params
 * @param {string} params.postalCode - Código postal de destino.
 * @param {Array} params.items - Items del carrito.
 * @returns {Promise<number>} - El costo de envío.
 */
export const getShippingCost = async ({ postalCode, items }) => {
  const totalWeightKg = calculateTotalWeight(items);

  // --- PUNTO DE INTEGRACIÓN REAL ---
  /*
  try {
    // ...
  } catch (error) {
    logger.error("Error al contactar la API de envíos:", error);
    throw new Error("No se pudo cotizar el envío en este momento.");
  }
  */

  // --- SIMULACIÓN MEJORADA (mientras no tengas credenciales) ---
  logger.debug(`Calculando envío desde ${ORIGIN_POSTAL_CODE} a ${postalCode} con peso ${totalWeightKg.toFixed(2)}kg`);

  const baseCost = 800;
  const costPerKg = 250;
  const distanceFactor = 1 + (Math.abs(parseInt(ORIGIN_POSTAL_CODE.charAt(0), 10) - parseInt(postalCode.charAt(0), 10))) * 0.15;
  
  const shippingCost = (baseCost + (costPerKg * totalWeightKg)) * distanceFactor;
  
  await new Promise(resolve => setTimeout(resolve, 400)); // Simular latencia de red
  
  return Math.ceil(shippingCost / 10) * 10; // Redondear al múltiplo de 10 más cercano
};
