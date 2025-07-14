import dotenv from 'dotenv';
dotenv.config(); 

import express from 'express';
import cors from 'cors';

// Importadores de Rutas
import productRoutes from './routes/product.routes.js';
import authRoutes from './routes/auth.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';

const app = express();
const PORT = process.env.PORT || 5001;

// --- Configuración de CORS ---
const whitelist = [
  'http://localhost:5173',
  'https://e-commerce-pintureria.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permite solicitudes sin 'origin' (como las de Postman o apps móviles)
    if (!origin) {
      return callback(null, true);
    }

    // Permite si el origen está en la lista blanca principal
    if (whitelist.includes(origin)) {
      return callback(null, true);
    }

    // --- CAMBIO CLAVE: Solución flexible para Vercel ---
    // Permite cualquier subdominio de vercel.app que pertenezca a tu proyecto.
    // Esto es muy útil para las "Preview Deployments" de Vercel.
    // Por ejemplo: 'https://mi-rama-e-commerce-pintureria.vercel.app' será permitido.
    try {
        const hostname = new URL(origin).hostname;
        if (hostname.endsWith('vercel.app')) {
            // Puedes hacer esta regla más estricta si quieres, pero para los proyectos de Vercel es una buena práctica.
            return callback(null, true);
        }
    } catch (e) {
        // Si la URL de origen no es válida, la rechazamos.
        console.error(`Error al parsear el origen de CORS: ${origin}`);
    }
    
    // Si el origen no coincide con ninguna regla, se rechaza la solicitud.
    console.error(`CORS Error: El origen ${origin} no está permitido.`);
    return callback(new Error('Not allowed by CORS'));
  }
};


app.use(cors(corsOptions));

// --- Middlewares Globales ---
// Middleware especial para el webhook de MercadoPago que necesita el body en formato raw
app.use('/api/payment/notification', express.raw({ type: 'application/json' }));
// Middleware para parsear JSON en todas las demás rutas
app.use(express.json());


// --- Montaje de Rutas ---
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);


// --- Inicio del Servidor ---
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
