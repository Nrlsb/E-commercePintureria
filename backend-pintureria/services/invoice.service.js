// backend-pintureria/services/invoice.service.js
import PDFDocument from 'pdfkit';
import logger from '../logger.js';

/**
 * Genera una factura en formato PDF para una orden específica.
 * @param {object} order - El objeto de la orden con detalles del cliente y los items.
 * @returns {Promise<Buffer>} - Una promesa que resuelve con el buffer del PDF generado.
 */
export const generateInvoicePDF = (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // --- Encabezado de la Factura ---
      doc.fontSize(20).font('Helvetica-Bold').text('la casa del pintor', 50, 50);
      doc.fontSize(10).font('Helvetica').text('SARMIENTO 1803 esq. CASTELLI - TEL: 3496413983', 50, 75);
      doc.text('(3080) ESPERANZA', 50, 90);

      doc.fontSize(12).font('Helvetica-Bold').text('FACTURA', 400, 50, { align: 'right' });
      doc.fontSize(10).font('Helvetica').text(`N°: 0062-${String(order.id).padStart(8, '0')}`, 400, 70, { align: 'right' });
      doc.text(`Fecha: ${new Date(order.created_at).toLocaleDateString('es-AR')}`, 400, 85, { align: 'right' });

      // --- Datos de la Empresa ---
      doc.moveTo(50, 110).lineTo(550, 110).stroke();
      doc.fontSize(8).text('C.U.I.T.: 20-11790771-7', 50, 120);
      doc.text('ING. BRUTOS CONV. MULT. N° 921-748273-1', 50, 135);
      doc.text('INICIO DE ACTIVIDAD: 01/11/1980', 50, 150);
      doc.moveTo(50, 165).lineTo(550, 165).stroke();

      // --- Datos del Cliente ---
      doc.fontSize(10).font('Helvetica-Bold').text('Sr./es.:', 50, 175);
      doc.text(order.user_name || `${order.first_name} ${order.last_name}`, 100, 175);
      doc.font('Helvetica-Bold').text('Domicilio:', 50, 190);
      doc.font('Helvetica').text(order.shipping_address || 'No especificado', 100, 190);
      doc.font('Helvetica-Bold').text('Cuit:', 50, 205);
      doc.font('Helvetica').text(order.user_dni || 'No especificado', 100, 205);
      doc.font('Helvetica-Bold').text('Cond. I.V.A:', 50, 220);
      doc.font('Helvetica').text('Consumidor Final', 120, 220);

      // --- Tabla de Items ---
      let tableTop = 250;
      doc.font('Helvetica-Bold');
      doc.text('Código', 50, tableTop);
      doc.text('Descripción', 110, tableTop);
      doc.text('Cantidad', 300, tableTop, { width: 60, align: 'right' });
      doc.text('P. Unitario', 370, tableTop, { width: 70, align: 'right' });
      doc.text('Total', 450, tableTop, { width: 90, align: 'right' });
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
      
      doc.font('Helvetica');
      let currentY = tableTop + 25;
      order.items.forEach(item => {
        // CORRECCIÓN: Asegurarse de que los valores numéricos sean números
        const unitPrice = parseFloat(item.price);
        const totalItemPrice = unitPrice * item.quantity;

        doc.text(String(item.product_id).padStart(6, '0'), 50, currentY);
        doc.text(item.name, 110, currentY, { width: 180 });
        doc.text(item.quantity, 300, currentY, { width: 60, align: 'right' });
        doc.text(unitPrice.toFixed(2), 370, currentY, { width: 70, align: 'right' });
        doc.text(totalItemPrice.toFixed(2), 450, currentY, { width: 90, align: 'right' });
        currentY += 20;
      });
      doc.moveTo(50, currentY).lineTo(550, currentY).stroke();

      // --- Totales ---
      // CORRECCIÓN: Convertir todos los valores monetarios a números antes de usarlos
      const totalAmount = parseFloat(order.total_amount);
      const shippingCost = parseFloat(order.shipping_cost) || 0;
      const subtotal = totalAmount - shippingCost;
      const iva = totalAmount * 0.21;
      const gravado = totalAmount - iva;

      currentY += 20;
      doc.font('Helvetica-Bold').text('SUBTOTAL', 400, currentY, { align: 'left' });
      doc.font('Helvetica').text(subtotal.toFixed(2), 0, currentY, { align: 'right' });
      currentY += 20;
      doc.font('Helvetica-Bold').text('GRAVADO', 400, currentY, { align: 'left' });
      doc.font('Helvetica').text(gravado.toFixed(2), 0, currentY, { align: 'right' });
      currentY += 20;
      doc.font('Helvetica-Bold').text('IVA 21%', 400, currentY, { align: 'left' });
      doc.font('Helvetica').text(iva.toFixed(2), 0, currentY, { align: 'right' });
      currentY += 25;
      doc.font('Helvetica-Bold').fontSize(12).text('TOTAL', 400, currentY, { align: 'left' });
      doc.font('Helvetica-Bold').text(`$ ${totalAmount.toFixed(2)}`, 0, currentY, { align: 'right' });

      // --- Pie de Página ---
      doc.fontSize(8).text('Documento no válido como factura', 50, 750, { align: 'center', width: 500 });
      
      doc.end();
    } catch (error) {
      logger.error('Error generando el PDF de la factura:', error);
      reject(error);
    }
  });
};
