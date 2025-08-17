// backend-pintureria/emailService.js
import nodemailer from 'nodemailer';
import logger from './logger.js';
import { generateInvoicePDF } from './services/invoice.service.js';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const formatCurrency = (amount) => new Intl.NumberFormat('es-AR').format(amount);

const generateItemsHtml = (items) => items.map(item => `
  <tr>
    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name} (x${item.quantity})</td>
    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${formatCurrency(item.price * item.quantity)}</td>
  </tr>
`).join('');

export const sendOrderConfirmationEmail = async (userEmail, order) => {
  const itemsHtml = generateItemsHtml(order.items);
  
  // Generar el PDF de la factura
  const invoicePdf = await generateInvoicePDF(order);

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h1 style="color: #0F3460;">¡Gracias por tu compra!</h1>
      <p>Hola, hemos recibido tu pago para el pedido #${order.id} y ya lo estamos preparando.</p>
      <p>Adjuntamos la factura de tu compra en formato PDF.</p>
      <h2 style="color: #0F3460;">Resumen del Pedido</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding: 10px; border-bottom: 2px solid #0F3460; text-align: left;">Producto</th>
            <th style="padding: 10px; border-bottom: 2px solid #0F3460; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
            <td style="padding: 10px; text-align: right; font-weight: bold;">$${formatCurrency(order.total_amount)}</td>
          </tr>
        </tfoot>
      </table>
      <p style="margin-top: 20px;">Gracias por confiar en Pinturerías Mercurio.</p>
    </div>
  `;

  const mailOptions = {
    from: `"Pinturerías Mercurio" <no-reply@nrlsb.com>`,
    to: userEmail,
    subject: `Confirmación y Factura de tu pedido #${order.id}`,
    html: emailHtml,
    attachments: [
        {
            filename: `factura-${order.id}.pdf`,
            content: invoicePdf,
            contentType: 'application/pdf'
        }
    ]
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Email de confirmación y factura enviado a ${userEmail} para la orden ${order.id}`);
  } catch (error) {
    logger.error(`Error al enviar email para la orden ${order.id}:`, error);
  }
};

// ... (el resto del archivo emailService.js permanece igual)
export const sendBankTransferInstructionsEmail = async (userEmail, order) => {
  const itemsHtml = generateItemsHtml(order.items);
  const { paymentData } = order; // Datos de pago de MP

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h1 style="color: #0F3460;">Instrucciones para tu Pedido #${order.id}</h1>
      <p>Hola, hemos recibido tu pedido y está pendiente de pago. Para completarlo, por favor realiza el pago usando los siguientes datos:</p>
      
      <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
        <h3 style="margin-top: 0; color: #0F3460;">Paga con PIX o Transferencia</h3>
        <p>Escanea el código QR desde la app de tu banco o Mercado Pago:</p>
        <img src="data:image/png;base64,${paymentData.qr_code_base64}" alt="Código QR para pagar" style="max-width: 200px; margin: 10px auto; display: block;"/>
        <p>O copia y pega el siguiente código:</p>
        <p style="font-family: monospace; background: #e0e0e0; padding: 10px; border-radius: 4px; word-break: break-all;">${paymentData.qr_code}</p>
        <p><strong>Monto a transferir:</strong> <strong style="font-size: 1.2em;">$${formatCurrency(order.total_amount)}</strong></p>
      </div>

      <p><strong>Importante:</strong> Tu orden y el stock de los productos se reservarán hasta la fecha de expiración indicada en tu app de pagos. Pasado ese tiempo, la orden será cancelada.</p>
      
      <h2 style="color: #0F3460; border-top: 1px solid #ccc; padding-top: 20px; margin-top: 30px;">Resumen del Pedido</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding: 10px; border-bottom: 2px solid #0F3460; text-align: left;">Producto</th>
            <th style="padding: 10px; border-bottom: 2px solid #0F3460; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
            <td style="padding: 10px; text-align: right; font-weight: bold;">$${formatCurrency(order.total_amount)}</td>
          </tr>
        </tfoot>
      </table>
      <p style="margin-top: 20px;">Gracias por confiar en Pinturerías Mercurio.</p>
    </div>
  `;

  const mailOptions = {
    from: `"Pinturerías Mercurio" <no-reply@nrlsb.com>`,
    to: userEmail,
    subject: `Instrucciones de pago para tu pedido #${order.id}`,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Email con instrucciones de transferencia enviado a ${userEmail} para la orden ${order.id}`);
  } catch (error) {
    logger.error(`Error al enviar email para la orden ${order.id}:`, error);
  }
};


export const sendPaymentReminderEmail = async (userEmail, order) => {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h1 style="color: #0F3460;">Recordatorio de Pago Pendiente</h1>
      <p>Hola, te recordamos que tu pedido #${order.id} aún está pendiente de pago.</p>
      <p>El stock de tus productos está reservado, pero la orden será cancelada automáticamente en 24 horas si no se recibe el pago.</p>
      <p><strong>Monto a transferir:</strong> <strong style="font-size: 1.2em;">$${formatCurrency(order.total_amount)}</strong></p>
      <p>Si ya realizaste el pago, por favor ignora este mensaje.</p>
      <p style="margin-top: 20px;">Gracias por tu tiempo.</p>
    </div>
  `;
  const mailOptions = {
    from: `"Pinturerías Mercurio" <no-reply@nrlsb.com>`,
    to: userEmail,
    subject: `Recordatorio de pago para tu pedido #${order.id}`,
    html: emailHtml,
  };
  await transporter.sendMail(mailOptions);
  logger.info(`Email de recordatorio enviado a ${userEmail} para la orden ${order.id}`);
};

export const sendOrderCancelledEmail = async (userEmail, order) => {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h1 style="color: #d9534f;">Orden Cancelada</h1>
      <p>Hola, te informamos que tu pedido #${order.id} ha sido cancelado debido a la falta de pago.</p>
      <p>El stock de los productos ha sido liberado. Si aún deseas los productos, deberás realizar una nueva compra.</p>
      <p style="margin-top: 20px;">Lamentamos los inconvenientes.</p>
    </div>
  `;
  const mailOptions = {
    from: `"Pinturerías Mercurio" <no-reply@nrlsb.com>`,
    to: userEmail,
    subject: `Tu pedido #${order.id} ha sido cancelado`,
    html: emailHtml,
  };
  await transporter.sendMail(mailOptions);
  logger.info(`Email de cancelación enviado a ${userEmail} para la orden ${order.id}`);
};

export const sendPasswordResetEmail = async (userEmail, token) => {
  const resetUrl = `${process.env.VITE_FRONTEND_URL}/reset-password/${token}`;
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h1 style="color: #0F3460;">Restablecer tu Contraseña</h1>
      <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" style="background-color: #0F3460; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Restablecer Contraseña
        </a>
      </p>
      <p>Si no solicitaste esto, por favor ignora este correo.</p>
      <p>Este enlace expirará en 1 hora.</p>
    </div>
  `;
  const mailOptions = {
    from: `"Pinturerías Mercurio" <no-reply@nrlsb.com>`,
    to: userEmail,
    subject: 'Restablecimiento de Contraseña',
    html: emailHtml,
  };
  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Email de reseteo de contraseña enviado a ${userEmail}`);
  } catch (error) {
    logger.error(`Error al enviar email de reseteo a ${userEmail}:`, error);
    throw new Error('No se pudo enviar el correo de restablecimiento.');
  }
};

export const sendOrderStatusUpdateEmail = async (userEmail, order, newStatus) => {
  const statusMap = {
    shipped: {
      subject: `Tu pedido #${order.id} ha sido enviado`,
      title: '¡Tu pedido está en camino!',
      message: `Hola, te informamos que tu pedido #${order.id} ha sido enviado.`,
      trackingMessage: order.tracking_number 
        ? `<p>Puedes seguir tu envío con el siguiente número de seguimiento: <strong>${order.tracking_number}</strong></p>`
        : ''
    },
    delivered: {
      subject: `Tu pedido #${order.id} ha sido entregado`,
      title: '¡Pedido Entregado!',
      message: `Hola, ¡buenas noticias! Tu pedido #${order.id} ha sido entregado. Esperamos que disfrutes tus productos.`,
      trackingMessage: ''
    }
  };

  const statusInfo = statusMap[newStatus];
  if (!statusInfo) {
    logger.warn(`Intento de enviar email para un estado desconocido: ${newStatus}`);
    return;
  }

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h1 style="color: #0F3460;">${statusInfo.title}</h1>
      <p>${statusInfo.message}</p>
      ${statusInfo.trackingMessage}
      <p style="margin-top: 20px;">Gracias por confiar en Pinturerías Mercurio.</p>
    </div>
  `;

  const mailOptions = {
    from: `"Pinturerías Mercurio" <no-reply@nrlsb.com>`,
    to: userEmail,
    subject: statusInfo.subject,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Email de estado '${newStatus}' enviado a ${userEmail} para la orden ${order.id}`);
  } catch (error) {
    logger.error(`Error al enviar email de estado '${newStatus}' para la orden ${order.id}:`, error);
  }
};
