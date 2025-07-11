// backend-pintureria/emailService.js
import nodemailer from 'nodemailer';

// Configura el "transportador" de correo.
// Utiliza las variables de entorno para las credenciales.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465, // true para puerto 465, false para otros
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Función para enviar el email de confirmación de compra
export const sendOrderConfirmationEmail = async (userEmail, order) => {
  // Genera el HTML para la lista de productos en el email
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name} (x${item.quantity})</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${new Intl.NumberFormat('es-AR').format(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  // Plantilla HTML del correo
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
    from: `"Pinturerías Mercurio" <${process.env.EMAIL_USER}>`,
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
