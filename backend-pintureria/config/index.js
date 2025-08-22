// backend-pintureria/config/index.js
import dotenv from 'dotenv';

dotenv.config();

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5001,
  
  database: {
    connectionString: process.env.DATABASE_URL,
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    databaseName: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  },

  jwtSecret: process.env.JWT_SECRET,
  jwtSecretPrevious: process.env.JWT_SECRET_PREVIOUS || null,

  mercadopago: {
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  },

  // --- NUEVA SECCIÓN PARA PAYWAY ---
  payway: {
    publicKey: process.env.PAYWAY_PUBLIC_KEY,
    privateKey: process.env.PAYWAY_PRIVATE_KEY,
    // El endpoint de desarrollo de Payway
    apiUrl: 'https://developers-ventasonline.payway.com.ar/api/v2', 
  },
  // --- FIN DE LA NUEVA SECCIÓN ---

  geminiApiKey: process.env.GEMINI_API_KEY,

  gcs: {
    projectId: process.env.GCS_PROJECT_ID,
    bucketName: process.env.GCS_BUCKET_NAME,
    keyFilename: process.env.GCS_KEYFILE,
    keyFileContent: process.env.GCS_KEYFILE_CONTENT,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },

  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    admin: process.env.ADMIN_EMAIL, // Correo del administrador para notificaciones
  },

  frontendUrl: process.env.VITE_FRONTEND_URL || 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5001',
  
  shipping: {
    originPostalCode: process.env.SHIPPING_API_ORIGIN_POSTAL_CODE || '3080',
    correoArgentinoAgreement: process.env.CORREO_ARGENTINO_AGREEMENT,
    correoArgentinoApiKey: process.env.CORREO_ARGENTINO_API_KEY,
  }
};

export default config;
