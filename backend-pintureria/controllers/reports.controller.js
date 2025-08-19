// backend-pintureria/controllers/reports.controller.js

import db from '../db.js';
import logger from '../logger.js';
import AppError from '../utils/AppError.js';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';

// --- Funciones de Generación de Datos ---

const getSalesByDimension = async (dimension, startDate, endDate) => {
  const validDimensions = { category: 'p.category', brand: 'p.brand' };
  if (!validDimensions[dimension]) {
    throw new AppError('Dimensión de reporte no válida.', 400);
  }

  const query = `
    SELECT 
      ${validDimensions[dimension]} AS dimension, 
      SUM(oi.price * oi.quantity) as "totalRevenue", 
      SUM(oi.quantity) as "totalItemsSold",
      COUNT(DISTINCT o.id) as "orderCount" 
    FROM orders o 
    JOIN order_items oi ON o.id = oi.order_id 
    JOIN products p ON oi.product_id = p.id 
    WHERE o.status = 'approved' AND o.created_at BETWEEN $1 AND $2 
    GROUP BY ${validDimensions[dimension]}
    ORDER BY "totalRevenue" DESC;
  `;
  const { rows } = await db.query(query, [startDate, endDate]);
  return rows;
};

const getCouponPerformance = async (startDate, endDate) => {
    const query = `
      SELECT 
        c.code,
        c.discount_type AS "discountType",
        c.discount_value AS "discountValue",
        COUNT(cu.id) as "timesUsed",
        SUM(
          CASE 
            WHEN c.discount_type = 'fixed' THEN c.discount_value
            WHEN c.discount_type = 'percentage' THEN (
              SELECT SUM(oi.price * oi.quantity) 
              FROM order_items oi 
              WHERE oi.order_id = o.id
            ) * (c.discount_value / 100)
            ELSE 0
          END
        ) as "totalDiscount"
      FROM coupons c
      JOIN coupon_usage cu ON c.id = cu.coupon_id
      JOIN orders o ON cu.order_id = o.id
      WHERE o.created_at BETWEEN $1 AND $2
      GROUP BY c.id
      ORDER BY "timesUsed" DESC;
    `;
    const { rows } = await db.query(query, [startDate, endDate]);
    return rows;
};

const getTopCustomers = async (startDate, endDate) => {
    const query = `
      SELECT 
        u.email, 
        u.first_name AS "firstName", 
        u.last_name AS "lastName", 
        SUM(o.total_amount) as "totalSpent", 
        COUNT(o.id) as "orderCount" 
      FROM users u 
      JOIN orders o ON u.id = o.user_id 
      WHERE o.status = 'approved' AND o.created_at BETWEEN $1 AND $2 
      GROUP BY u.id 
      ORDER BY "totalSpent" DESC 
      LIMIT 20;
    `;
    const { rows } = await db.query(query, [startDate, endDate]);
    return rows;
};

// --- Funciones de Exportación ---

const exportToCsv = (data, fields, fileName) => {
  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(data);
  return {
    fileName: `${fileName}.csv`,
    mimeType: 'text/csv',
    data: csv,
  };
};

const exportToPdf = (data, title, columns) => {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve({
        fileName: `${title.replace(/\s+/g, '-')}.pdf`,
        mimeType: 'application/pdf',
        data: Buffer.concat(buffers),
    }));

    // Título
    doc.fontSize(18).text(title, { align: 'center' });
    doc.moveDown();

    // Tabla
    const tableTop = 100;
    const rowHeight = 25;
    const colWidths = columns.map(c => c.width);
    const colPositions = colWidths.reduce((acc, width, i) => [...acc, (acc[i] || 0) + width], [30]);

    // Encabezados
    doc.fontSize(10).font('Helvetica-Bold');
    columns.forEach((col, i) => doc.text(col.label, colPositions[i], tableTop));
    doc.moveTo(30, tableTop + 20).lineTo(780, tableTop + 20).stroke();

    // Filas
    doc.fontSize(9).font('Helvetica');
    data.forEach((row, rowIndex) => {
        const y = tableTop + (rowIndex + 1) * rowHeight;
        columns.forEach((col, i) => {
            let value = row[col.key] || '';
            if (col.format) value = col.format(value);
            doc.text(String(value), colPositions[i], y);
        });
    });

    doc.end();
  });
};


// --- Controlador Principal ---

export const generateReport = async (req, res, next) => {
    const { reportType, startDate, endDate, format = 'json' } = req.body;

    if (!reportType || !startDate || !endDate) {
        return next(new AppError('Faltan parámetros requeridos para generar el reporte.', 400));
    }

    try {
        let data, fields, columns, title;

        switch (reportType) {
            case 'salesByCategory':
                data = await getSalesByDimension('category', startDate, endDate);
                title = 'Reporte de Ventas por Categoría';
                fields = [{ label: 'Categoría', value: 'dimension' }, { label: 'Ingresos Totales', value: 'totalRevenue' }, { label: 'Items Vendidos', value: 'totalItemsSold' }, { label: 'N° de Órdenes', value: 'orderCount' }];
                columns = [{ key: 'dimension', label: 'Categoría', width: 150 }, { key: 'totalRevenue', label: 'Ingresos', width: 150, format: v => `$${v}` }, { key: 'totalItemsSold', label: 'Items Vendidos', width: 150 }, { key: 'orderCount', label: 'Órdenes', width: 150 }];
                break;
            case 'salesByBrand':
                data = await getSalesByDimension('brand', startDate, endDate);
                title = 'Reporte de Ventas por Marca';
                fields = [{ label: 'Marca', value: 'dimension' }, { label: 'Ingresos Totales', value: 'totalRevenue' }, { label: 'Items Vendidos', value: 'totalItemsSold' }, { label: 'N° de Órdenes', value: 'orderCount' }];
                columns = [{ key: 'dimension', label: 'Marca', width: 150 }, { key: 'totalRevenue', label: 'Ingresos', width: 150, format: v => `$${v}` }, { key: 'totalItemsSold', label: 'Items Vendidos', width: 150 }, { key: 'orderCount', label: 'Órdenes', width: 150 }];
                break;
            case 'couponPerformance':
                data = await getCouponPerformance(startDate, endDate);
                title = 'Reporte de Rendimiento de Cupones';
                fields = [{ label: 'Código', value: 'code' }, { label: 'Veces Usado', value: 'timesUsed' }, { label: 'Descuento Total', value: 'totalDiscount' }];
                columns = [{ key: 'code', label: 'Código', width: 150 }, { key: 'timesUsed', label: 'Usos', width: 150 }, { key: 'totalDiscount', label: 'Descuento Total', width: 150, format: v => `$${parseFloat(v).toFixed(2)}` }];
                break;
            case 'topCustomers':
                data = await getTopCustomers(startDate, endDate);
                title = 'Reporte de Mejores Clientes';
                fields = [{ label: 'Email', value: 'email' }, { label: 'Nombre', value: row => `${row.firstName} ${row.lastName}` }, { label: 'Gasto Total', value: 'totalSpent' }, { label: 'N° de Órdenes', value: 'orderCount' }];
                columns = [{ key: 'email', label: 'Email', width: 200 }, { key: 'firstName', label: 'Nombre', width: 150 }, { key: 'totalSpent', label: 'Gasto Total', width: 150, format: v => `$${v}` }, { key: 'orderCount', label: 'Órdenes', width: 100 }];
                break;
            default:
                throw new AppError('Tipo de reporte no válido.', 400);
        }

        if (format === 'csv') {
            const csvFile = exportToCsv(data, fields, reportType);
            res.header('Content-Type', csvFile.mimeType);
            res.attachment(csvFile.fileName);
            return res.send(csvFile.data);
        } else if (format === 'pdf') {
            const pdfFile = await exportToPdf(data, title, columns);
            res.header('Content-Type', pdfFile.mimeType);
            res.attachment(pdfFile.fileName);
            return res.send(pdfFile.data);
        } else {
            res.json(data);
        }

    } catch (error) {
        next(error);
    }
};
