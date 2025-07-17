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

/**
 * --- NUEVA FUNCIÓN ---
 * Envía un correo electrónico con el enlace para restablecer la contraseña.
 * @param {string} userEmail - El email del destinatario.
 * @param {string} token - El token único de reseteo.
 */
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
    // Es importante manejar este error para que la aplicación no se caiga.
    throw new Error('No se pudo enviar el correo de restablecimiento.');
  }
};
