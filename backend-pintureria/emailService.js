// backend-pintureria/emailService.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- NUEVA FUNCIÓN ---
/**
 * Envía un correo con las instrucciones para el pago por transferencia.
 * @param {string} userEmail - El email del destinatario.
 * @param {object} order - El objeto de la orden.
 */
export const sendBankTransferInstructionsEmail = async (userEmail, order) => {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name} (x${item.quantity})</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${new Intl.NumberFormat('es-AR').format(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h1 style="color: #0F3460;">Instrucciones para tu Pedido #${order.id}</h1>
      <p>Hola, hemos recibido tu pedido y está pendiente de pago. Para completarlo, por favor realiza una transferencia con los siguientes datos:</p>
      
      <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0F3460;">Datos para la Transferencia</h3>
        <p><strong>Banco:</strong> Banco de la Plaza</p>
        <p><strong>Titular:</strong> Pinturerías Mercurio S.A.</p>
        <p><strong>CUIT:</strong> 30-12345678-9</p>
        <p><strong>CBU/CVU:</strong> 0001112223334445556667</p>
        <p><strong>Alias:</strong> PINTU.MERCURIO.MP</p>
        <p><strong>Monto a transferir:</strong> <strong style="font-size: 1.2em;">$${new Intl.NumberFormat('es-AR').format(order.total_amount)}</strong></p>
      </div>

      <p>Una vez realizada la transferencia, tu pedido será procesado. No es necesario que nos envíes el comprobante.</p>
      <p><strong>Importante:</strong> Tu orden y el stock de los productos se reservarán por 48 horas. Pasado ese tiempo, la orden será cancelada.</p>
      
      <h2 style="color: #0F3460; border-top: 1px solid #ccc; padding-top: 20px; margin-top: 30px;">Resumen del Pedido</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding: 10px; border-bottom: 2px solid #0F3460; text-align: left;">Producto</th>
            <th style="padding: 10px; border-bottom: 2px solid #0F3460; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
            <td style="padding: 10px; text-align: right; font-weight: bold;">$${new Intl.NumberFormat('es-AR').format(order.total_amount)}</td>
          </tr>
        </tfoot>
      </table>
      <p style="margin-top: 20px;">Gracias por confiar en Pinturerías Mercurio.</p>
    </div>
  `;

  const mailOptions = {
    from: `"Pinturerías Mercurio" <onboarding@resend.dev>`,
    to: userEmail,
    subject: `Instrucciones de pago para tu pedido #${order.id}`,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email con instrucciones de transferencia enviado a ${userEmail} para la orden ${order.id}`);
  } catch (error) {
    console.error(`Error al enviar email para la orden ${order.id}:`, error);
  }
};


export const sendOrderConfirmationEmail = async (userEmail, order) => {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name} (x${item.quantity})</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${new Intl.NumberFormat('es-AR').format(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h1 style="color: #0F3460;">¡Gracias por tu compra!</h1>
      <p>Hola, hemos recibido tu pedido #${order.id} y ya lo estamos preparando.</p>
      <h2 style="color: #0F3460;">Resumen del Pedido</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding: 10px; border-bottom: 2px solid #0F3460; text-align: left;">Producto</th>
            <th style="padding: 10px; border-bottom: 2px solid #0F3460; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
            <td style="padding: 10px; text-align: right; font-weight: bold;">$${new Intl.NumberFormat('es-AR').format(order.total_amount)}</td>
          </tr>
        </tfoot>
      </table>
      <p style="margin-top: 20px;">Gracias por confiar en Pinturerías Mercurio.</p>
    </div>
  `;

  const mailOptions = {
    from: `"Pinturerías Mercurio" <onboarding@resend.dev>`,
    to: userEmail,
    subject: `Confirmación de tu pedido #${order.id}`,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de confirmación enviado a ${userEmail} para la orden ${order.id}`);
  } catch (error) {
    console.error(`Error al enviar email para la orden ${order.id}:`, error);
  }
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
    from: `"Pinturerías Mercurio" <onboarding@resend.dev>`,
    to: userEmail,
    subject: 'Restablecimiento de Contraseña',
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de reseteo de contraseña enviado a ${userEmail}`);
  } catch (error) {
    console.error(`Error al enviar email de reseteo a ${userEmail}:`, error);
    throw new Error('No se pudo enviar el correo de restablecimiento.');
  }
};
