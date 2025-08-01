// backend-pintureria/services/shippingService.js
import fetch from 'node-fetch';
import logger from '../logger.js';
import config from '../config/index.js';
import AppError from '../utils/AppError.js';

// --- Lógica de cálculo de paquete (mejorada) ---

/**
 * Calcula el peso y volumen total de los items del carrito.
 * NOTA: Para mayor precisión, se recomienda añadir peso y dimensiones a cada producto en la DB.
 * @param {Array} items - Los items del carrito.
 * @returns {{totalWeightKg: number, totalVolumeCm3: number}} - El peso y volumen totales.
 */
const calculatePackageDetails = (items) => {
  // Simulación: asumimos valores por defecto para cada lata de pintura.
  const DEFAULT_WEIGHT_KG = 4; // 4 kg por lata
  const DEFAULT_VOLUME_CM3 = 15 * 15 * 20; // 4500 cm³ (15x15x20 cm) por lata

  return items.reduce((totals, item) => {
    const quantity = item.quantity || 1;
    totals.totalWeightKg += quantity * (item.weight || DEFAULT_WEIGHT_KG);
    totals.totalVolumeCm3 += quantity * (item.volume || DEFAULT_VOLUME_CM3);
    return totals;
  }, { totalWeightKg: 0, totalVolumeCm3: 0 });
};

/**
 * --- ACTUALIZADO: Obtiene el costo de envío desde la API de Correo Argentino. ---
 * @param {object} params
 * @param {string} params.postalCode - Código postal de destino.
 * @param {Array} params.items - Items del carrito.
 * @returns {Promise<number>} - El costo de envío.
 */
export const getShippingCost = async ({ postalCode, items }) => {
  const { 
    correoArgentinoAgreement, 
    correoArgentinoApiKey,
    originPostalCode 
  } = config.shipping;

  // 1. Validar que las credenciales estén configuradas
  if (!correoArgentinoAgreement || !correoArgentinoApiKey) {
    logger.error('Credenciales de Correo Argentino (agreement o api-key) no configuradas en el archivo .env');
    throw new AppError('El servicio de envíos no está configurado correctamente.', 500);
  }

  // 2. Calcular detalles del paquete
  const { totalWeightKg, totalVolumeCm3 } = calculatePackageDetails(items);
  
  const totalWeightGrams = totalWeightKg * 1000;

  // 3. Construir el cuerpo de la solicitud para la API de cotización (si existiera una)
  // Como la documentación no muestra un endpoint de cotización, simularemos el costo
  // basado en la información que SÍ se usaría para crear una orden.
  
  // --- SIMULACIÓN MANTENIDA HASTA TENER ENDPOINT DE COTIZACIÓN ---
  // La API que proporcionaste se enfoca en "Alta de orden", no en "Cotización".
  // Mantendremos la simulación por ahora, pero con las credenciales listas para cuando
  // encuentres el endpoint correcto o decidas implementarlo al crear la orden.
  
  logger.debug(`Calculando envío simulado desde ${originPostalCode} a ${postalCode} con peso ${totalWeightKg.toFixed(2)}kg`);

  const baseCost = 800;
  const costPerKg = 250;
  const distanceFactor = 1 + (Math.abs(parseInt(originPostalCode.charAt(0), 10) - parseInt(postalCode.charAt(0), 10))) * 0.15;
  
  const shippingCost = (baseCost + (costPerKg * totalWeightKg)) * distanceFactor;
  
  await new Promise(resolve => setTimeout(resolve, 400)); // Simular latencia de red
  
  return Math.ceil(shippingCost / 10) * 10; // Redondear al múltiplo de 10 más cercano
};
