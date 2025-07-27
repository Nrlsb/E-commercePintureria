// backend-pintureria/controllers/analytics.controller.js
import db from '../db.js';
import logger from '../logger.js';

/**
 * Obtiene un conjunto de estadísticas y datos clave para el dashboard de administración.
 */
export const getDashboardAnalytics = async (req, res, next) => {
  try {
    // 1. Métricas clave (KPIs)
    // Todas las consultas aquí son estáticas y no usan entrada de usuario, por lo que son seguras.
    const kpiQuery = `
      SELECT
        (SELECT SUM(total_amount) FROM orders WHERE status = 'approved') as "totalRevenue",
        (SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '30 days') as "newOrders",
        (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days') as "newCustomers",
        (SELECT COUNT(*) FROM products WHERE is_active = true) as "activeProducts"
    `;

    // 2. Productos más vendidos (Top 5)
    const topProductsQuery = `
      SELECT p.name, SUM(oi.quantity) as "totalSold"
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'approved'
      GROUP BY p.name
      ORDER BY "totalSold" DESC
      LIMIT 5;
    `;

    // 3. Ventas de los últimos 30 días
    const salesOverTimeQuery = `
      SELECT 
        DATE_TRUNC('day', created_at)::date as date, 
        SUM(total_amount) as "dailyRevenue"
      FROM orders 
      WHERE status = 'approved' AND created_at >= NOW() - INTERVAL '30 days' 
      GROUP BY 1 
      ORDER BY 1;
    `;
    
    // 4. Órdenes recientes (Últimas 5)
    const recentOrdersQuery = `
        SELECT o.id, o.total_amount, o.status, o.created_at, u.email as user_email 
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 5;
    `;

    // Ejecutar todas las consultas en paralelo para mayor eficiencia
    const [
      kpiResult, 
      topProductsResult, 
      salesOverTimeResult,
      recentOrdersResult
    ] = await Promise.all([
      db.query(kpiQuery),
      db.query(topProductsQuery),
      db.query(salesOverTimeQuery),
      db.query(recentOrdersQuery)
    ]);

    // Devolver todos los datos en un solo objeto JSON
    res.json({
      kpis: kpiResult.rows[0],
      topProducts: topProductsResult.rows,
      salesOverTime: salesOverTimeResult.rows,
      recentOrders: recentOrdersResult.rows
    });

  } catch (error) {
    logger.error('Error fetching dashboard analytics:', error);
    next(error);
  }
};
