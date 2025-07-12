E-commerce "Pinturerías Mercurio" - Proyecto Full-StackEste repositorio contiene el código fuente de un proyecto de e-commerce completo, desarrollado con un stack tecnológico moderno y desplegado en una arquitectura en la nube. La plataforma permite a los clientes navegar, comprar productos y gestionar sus órdenes, mientras que los administradores tienen control total sobre el catálogo, las ventas y el contenido.Sitio en vivo: https://e-commerce-pintureria.vercel.app/🚀 Funcionalidades PrincipalesPara ClientesCatálogo de Productos: Navegación por categorías, búsqueda por texto y páginas de detalle con información completa.Sistema de Reseñas: Los usuarios autenticados pueden calificar productos (1-5 estrellas) y dejar comentarios.Carrito de Compras: Funcionalidad completa para añadir, actualizar la cantidad y eliminar productos.Flujo de Pago Real: Integración completa con Mercado Pago (Checkout Pro) para procesar pagos de forma segura.Notificaciones Automáticas: Envío de emails de confirmación al realizar una compra exitosa.Gestión de Cuenta: Acceso a un historial de compras detallado desde el perfil del usuario.Para AdministradoresPanel de Administración Seguro: Un área privada (/admin) protegida por rol de administrador.Gestión de Productos (CRUD): Control total para crear, leer, actualizar y eliminar productos del catálogo.Gestión de Órdenes: Visualización de todas las órdenes realizadas en la tienda con sus detalles.Cancelación y Reembolsos: Capacidad para cancelar órdenes aprobadas, procesando automáticamente un reembolso completo al cliente a través de la API de Mercado Pago.Moderación de Contenido: Permiso para eliminar reseñas de cualquier producto para mantener la calidad del sitio.🛠️ Stack TecnológicoCapaTecnologías ClaveFrontendReact (con Vite), React Router, Tailwind CSS, Mercado Pago SDK.BackendNode.js, Express.js, PostgreSQL, JWT, bcrypt.js, Nodemailer.InfraestructuraVercel (Despliegue Frontend), Render (Despliegue Backend), Supabase (Base de Datos).⚙️ Configuración y Ejecución LocalPara ejecutar este proyecto en tu máquina local, necesitarás tener instalados Node.js y PostgreSQL.1. Backend# Navega a la carpeta del backend
cd backend-pintureria

# Instala las dependencias
npm install

# Crea un archivo .env en la raíz de esta carpeta y configúralo.
# (Ver la sección de Variables de Entorno más abajo)

# Inicia el servidor de desarrollo
node server.js
El servidor del backend correrá en http://localhost:5001.2. Frontend# Navega a la carpeta del frontend
cd Frontend/mi-tienda-pintura

# Instala las dependencias
npm install

# Crea un archivo .env.local en la raíz de esta carpeta y configúralo.
# (Ver la sección de Variables de Entorno más abajo)

# Inicia la aplicación de React
npm run dev
La aplicación del frontend correrá en http://localhost:5173 (o el puerto que indique Vite).🔑 Variables de EntornoDeberás crear archivos .env para que el proyecto funcione localmente.Backend (backend-pintureria/.env)# Base de Datos (PostgreSQL)
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=nombre_de_tu_bd
DB_PASSWORD=tu_contraseña
DB_PORT=5432

# Autenticación
JWT_SECRET=un_secreto_muy_largo_y_dificil_de_adivinar

# Mercado Pago (Usa credenciales de PRUEBA para desarrollo)
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Email (Configuración para Nodemailer, ej: Resend, Mailtrap)
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=465
EMAIL_USER=resend
EMAIL_PASS=tu_api_key_de_resend

# URLs de la aplicación (Importante para el webhook y redirecciones)
VITE_FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5001
Frontend (Frontend/mi-tienda-pintura/.env.local)# URL del Backend
VITE_API_URL=http://localhost:5001

# Llave pública de Mercado Pago (Usa la Public Key de PRUEBA)
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
¡Gracias por revisar el proyecto!