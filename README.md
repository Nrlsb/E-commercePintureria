# E-commerce "Pinturerías Mercurio" - Proyecto Full-Stack

¡Bienvenido al repositorio del proyecto "Pinturerías Mercurio"! Esta es una aplicación de e-commerce completa, desarrollada con un stack tecnológico moderno, una arquitectura robusta y un fuerte enfoque en la **experiencia de usuario (UX)**, el **rendimiento** y la **seguridad**. La plataforma ofrece una experiencia de compra integral para los clientes y herramientas de gestión potentes para los administradores.

**Sitio en Producción:** <https://www.nrlsb.com/>

**Estado de la Integración de Pagos:** ¡Aprobada! La integración con Mercado Pago ha superado la prueba de calidad con una puntuación de **94/100**, asegurando un flujo de pago robusto y seguro.

### 📖 Guía del Proyecto

* [Visión General](#-visión-general)
* [Funcionalidades Clave](#-funcionalidades-clave)
* [Stack Tecnológico](#️-stack-tecnológico)
* [Arquitectura y Seguridad](#-arquitectura-y-seguridad)
* [Flujos de Datos Detallados](#-flujos-de-datos-detallados)
* [Pruebas Automatizadas](#-pruebas-automatizadas)
* [Configuración y Ejecución Local](#️-configuración-y-ejecución-local)
* [Variables de Entorno](#-variables-de-entorno)

### 🚀 Visión General

Este proyecto simula una tienda online real, permitiendo a los usuarios navegar por un catálogo de productos, realizar búsquedas y filtros, gestionar su carrito de compras, guardar productos en una lista de deseos y realizar pagos a través de múltiples métodos. La integración de pagos se realiza a través de **Mercado Pago (Checkout API)** y se complementa con un sistema de pago por transferencia bancaria offline.

Por otro lado, los administradores tienen acceso a un panel privado con herramientas avanzadas para gestionar el inventario, supervisar las ventas con filtros y búsquedas, y moderar el contenido del sitio. La aplicación está diseñada priorizando la experiencia de usuario, el rendimiento (con técnicas como *Lazy Loading*, caché en **Redis** y actualizaciones optimistas en la UI) y la seguridad, incluyendo la automatización de notificaciones y la gestión de órdenes pendientes. Las funcionalidades de **Inteligencia Artificial (IA) con Google Gemini** elevan la eficiencia en la gestión de productos.

### ✨ Funcionalidades Clave

#### Para Clientes

* **Catálogo de Productos Optimizado:**
    * Navegación intuitiva por categorías.
    * **Búsqueda con Debouncing:** La búsqueda de productos es eficiente y no sobrecarga el servidor.
    * **Filtros Interactivos:** Los productos se filtran instantáneamente al seleccionar marcas o precios, sin necesidad de recargar la página.
    * **Paginación Inteligente:** Navegación cómoda a través de catálogos extensos.
    * **Vista Rápida de Producto:** Permite ver detalles y añadir al carrito desde una ventana modal sin abandonar la página actual.
* **Gestión de Cuentas y Perfil:**
    * Registro, inicio de sesión (con JWT y Google OAuth) y un flujo completo de recuperación de contraseña vía email.
    * **Perfil de Usuario:** Una sección dedicada para que los usuarios puedan ver y actualizar su información personal y direcciones de envío.
* **Carrito de Compra con UX Mejorada:**
    * **Actualizaciones Optimistas:** Añadir, eliminar o actualizar productos en el carrito se refleja instantáneamente en la UI para una sensación de velocidad superior.
    * Funcionalidad completa para añadir, actualizar y eliminar productos. El estado del carrito persiste en `localStorage` gracias a Zustand.
* **Lista de Deseos (Wishlist):**
    * Los usuarios autenticados pueden guardar sus productos favoritos en una lista de deseos personal.
    * **UI Optimista:** Añadir o quitar productos de la lista es instantáneo.
    * Página dedicada para ver y gestionar los productos guardados.
* **Múltiples Métodos de Pago:**
    * **Mercado Pago:** Pago seguro con tarjeta de crédito/débito y saldo en cuenta.
    * **Transferencia Bancaria:** Opción de pago offline con instrucciones claras.
* **Sistema de Cupones de Descuento:** Aplicación de cupones de porcentaje o de monto fijo en el carrito de compras.
* **Cálculo de Envío:** Estimación de costos de envío basada en el código postal.
* **Sistema de Reseñas y Calificaciones:** Los usuarios autenticados pueden calificar productos y dejar comentarios.
* **Historial de Compras:** Acceso a un historial de compras detallado desde el perfil del usuario.
* **Experiencia de Usuario Fluida:**
    * **Animaciones y Transiciones:** Transiciones suaves entre páginas y microinteracciones que brindan feedback visual al usuario, implementadas con `framer-motion`.
    * **Optimización SEO:** Títulos de página dinámicos, meta descripciones y datos estructurados (Schema.org) para mejorar la visibilidad en buscadores.

#### Para Administradores

* **Panel de Administración Seguro:** Un área privada (`/admin`) protegida por rol de administrador a nivel de API.
* **Dashboard de Analíticas:** Visualización de métricas clave como ingresos, nuevas órdenes, clientes y productos más vendidos.
* **Gestión de Productos (CRUD) con Soft Deletes:** Control total para crear, leer, actualizar y "desactivar" productos, manteniendo la integridad de los datos de órdenes antiguas.
* **Gestión de Órdenes Avanzada:**
    * Visualización de todas las órdenes con filtros por estado y búsqueda por ID o email.
    * **Modales de Confirmación:** Acciones críticas como cancelar una orden o confirmar un pago utilizan modales personalizados para una mejor UX y seguridad.
* **Gestión de Cupones Avanzada (CRUD):**
    * Interfaz completa para crear, editar, activar/desactivar y eliminar cupones de descuento.
    * Soporte para reglas complejas: monto mínimo de compra, límites de uso, fechas de expiración.
* **Gestión de Pagos Offline:** Botón para confirmar manualmente la recepción de pagos por transferencia.
* **Cancelación y Reembolsos:** Capacidad para cancelar órdenes aprobadas, procesando automáticamente un reembolso completo a través de la API de Mercado Pago.
* **Sistema de Cancelación Automatizado:** Una tarea programada (Cron Job) se ejecuta periódicamente para cancelar órdenes por transferencia no pagadas y reponer el stock automáticamente.
* **Funcionalidades con IA (Google Gemini):**
    * **Creación Masiva de Productos:** Sube múltiples imágenes de productos y la IA de Gemini generará automáticamente un nombre, descripción y categoría.
    * **Asociación Inteligente de Imágenes:** Sube imágenes y la IA las asociará con los productos existentes en el catálogo, reemplazando la imagen actual.
    * **Análisis de Imagen con IA:** Permite analizar una sola imagen para sugerir datos de producto (nombre, descripción, categoría).
* **Limpieza de Caché:** Opción para limpiar la caché de Redis desde el panel de administración.

### 🛠️ Stack Tecnológico

| Capa | Tecnologías Clave |
| :--- | :--- |
| **Frontend** | React (con Vite), React Router, **Zustand** (gestión de estado), Tailwind CSS, **Framer Motion** (animaciones). |
| **Backend** | Node.js, Express.js, JWT, bcrypt.js, **Nodemailer**, Cors, Dotenv, **node-cron**, **Winston** (Logging), **express-validator**, **Helmet**, **express-rate-limit**, **csurf**. |
| **Base de Datos** | PostgreSQL (gestionada a través de Render/Supabase). |
| **Caché** | **Redis** para cachear consultas de productos y mejorar el rendimiento. |
| **Pruebas** | **Vitest** y **React Testing Library** (Frontend), **Jest** y **Supertest** (Backend), **Cypress** (End-to-End). |
| **Infraestructura** | **Vercel** (Despliegue Frontend), **Render** (Despliegue Backend y Base de Datos). |
| **Pasarela de Pagos** | Mercado Pago (Checkout API - Bricks). |
| **Servicio de Email** | **Resend**. |
| **IA Generativa** | **Google Gemini API** para el análisis de imágenes y generación de texto. |
| **Almacenamiento de Archivos** | Google Cloud Storage, Multer, Sharp (para optimización de imágenes). |

### 🏗️ Arquitectura y Seguridad

El proyecto está estructurado en dos partes principales: un frontend SPA y un backend RESTful.

#### Frontend (React)

Construido con Vite, sigue una arquitectura basada en componentes con una clara separación de responsabilidades:

* **`components`**: Componentes de UI reutilizables.
* **`pages`**: Vistas principales de la aplicación, cargadas con `React.lazy()` para optimizar el rendimiento.
* **`stores`**: Gestión de estado global centralizada con **Zustand**, utilizando el middleware `persist` para mantener el estado del carrito y la autenticación.
* **`hooks`**: **Hooks personalizados** (ej. `usePayment`) para encapsular y reutilizar la lógica de negocio.

#### Backend (Node.js)

API RESTful modularizada para facilitar el mantenimiento y la escalabilidad:

* **`config`**: **Configuración Centralizada**: Un único archivo (`config/index.js`) lee y exporta todas las variables de entorno.
* **`routes`**: Definen los endpoints de la API.
* **`controllers`**: Manejan las solicitudes y respuestas HTTP.
* **`services`**: **Capa de Servicios**: Contienen la lógica de negocio principal (ej. `auth.service.js`), manteniendo los controladores limpios.
* **`middlewares`**: Funciones para manejar la autenticación (JWT), autorización por roles (`isAdmin`), validación de entradas (`express-validator`), **rate limiting** para rutas sensibles y un **manejador de errores centralizado**.
* **Logging:** Se utiliza **Winston** para un registro detallado de peticiones y errores.

La seguridad y el rendimiento se manejan a nivel de API y de base de datos:

* **Validación de Tokens JWT:** Para proteger rutas y asegurar que los usuarios solo puedan acceder a sus propios datos.
* **Control de Acceso Basado en Roles (RBAC)**: Implementado para proteger rutas sensibles en el backend.
* **Protección CSRF (Cross-Site Request Forgery)**: Implementado en el backend con `csurf` y gestionado en el frontend para proteger todas las peticiones que modifican el estado.
* **Validación y Sanitización Exhaustiva de Entrada**: Cada entrada de usuario es validada y sanitizada en el backend usando `express-validator` para prevenir ataques como XSS e inyección de datos.
* **Prevención de SQL Injection**: Todas las consultas a la base de datos se realizan utilizando parámetros de consulta (*prepared statements*).
* **Cabeceras de Seguridad HTTP**: Configuración de cabeceras de seguridad usando `helmet`.
* **Rate Limiting:** Se limita el número de intentos de login y registro para prevenir ataques de fuerza bruta.
* **Soft Deletes:** Los productos no se eliminan, sino que se marcan como inactivos para preservar la integridad de los datos.
* **Transacciones de Base de Datos:** Las operaciones críticas que involucran múltiples escrituras están envueltas en transacciones (`BEGIN`, `COMMIT`, `ROLLBACK`).
* **Caché con Redis:** Las consultas frecuentes de productos se cachean para reducir la carga en la base de datos y acelerar las respuestas.
* **CORS (Cross-Origin Resource Sharing)**: Configurado de forma segura para permitir solo los orígenes necesarios en producción.

### 🌊 Flujos de Datos Detallados

#### Proceso de Compra (Checkout API)

1.  **Checkout (Frontend):** El usuario navega a la página de checkout. La página verifica que el monto total sea superior al mínimo requerido por Mercado Pago.
2.  **Renderizado del Formulario:** Se renderiza el brick `CardPayment` de Mercado Pago, que proporciona un formulario seguro para ingresar los datos de la tarjeta.
3.  **Envío de Formulario (Frontend):** Al enviar, el brick tokeniza de forma segura los datos de la tarjeta y los devuelve junto con la información del pagador.
4.  **Procesamiento del Pago (Backend):** El frontend envía el token y los detalles de la compra a la ruta `POST /api/orders/process-payment`. El backend:
    a. Crea una orden en la base de datos con estado `pending`.
    b. Envía la información del pago (incluyendo el token) a la API de Mercado Pago.
5.  **Notificación de Webhook (Mercado Pago a Backend):** Mercado Pago envía una notificación asíncrona a la `notification_url` configurada en tu backend (`/api/payment/notification`).
6.  **Procesamiento del Webhook (Backend):** Tu backend recibe el webhook, lo guarda en la tabla `webhook_events`, y luego, en segundo plano (`webhook.service.js`), procesa la notificación:
    a. Consulta los detalles del pago a la API de Mercado Pago usando el ID de la notificación.
    b. **Si el pago es `approved`**: Actualiza el estado de la orden a `approved`, descuenta el stock de los productos.
    c. Envía un email de confirmación al usuario.
    d. Marca el evento del webhook como procesado.
7.  **Redirección (Frontend):** El frontend redirige al usuario a la página de éxito o de fallo según la respuesta inicial de `process-payment`.

#### Proceso de Compra (Transferencia Bancaria)

1.  **Checkout (Frontend):** El usuario selecciona "Transferencia Bancaria" como método de pago.
2.  **Confirmación de Orden (Frontend):** Al confirmar, el frontend envía los detalles del carrito y el total a la ruta `POST /api/orders/bank-transfer`.
3.  **Creación de Orden (Backend):** El backend:
    a. Verifica el stock de los productos en el carrito.
    b. Crea una orden en la base de datos con estado `pending_transfer`.
    c. Descuenta el stock de los productos para reservarlos.
    d. Envía un email al usuario con las instrucciones de transferencia.
4.  **Redirección (Frontend):** El frontend redirige al usuario a una página de "orden pendiente" con los detalles de la transferencia.
5.  **Confirmación Manual (Administrador):** Un administrador puede, desde el panel de administración, confirmar manualmente que el pago por transferencia ha sido recibido para una orden específica. Esto actualiza el estado de la orden a `approved` y envía un email de confirmación al cliente.
6.  **Cancelación Automática (Cron Job):** Una tarea programada en el backend (`cronService.js`) verifica periódicamente las órdenes con estado `pending_transfer`:
    a. Si la orden tiene más de 48 horas sin pago, la cancela y repone el stock de los productos. Envía un email de cancelación al cliente.
    b. Si la orden tiene entre 24 y 25 horas sin pago, envía un email de recordatorio al cliente.

### 🧪 Pruebas Automatizadas

El proyecto cuenta con una estrategia de pruebas multinivel:

* **Pruebas Unitarias y de Integración (Frontend):** Con **Vitest** y **React Testing Library** para probar componentes y stores.
* **Pruebas de API (Backend):** Con **Jest** y **Supertest** para verificar la lógica de los endpoints.
* **Pruebas End-to-End (E2E):** Con **Cypress** para simular flujos de usuario completos.

**Comandos para ejecutar las pruebas:**

```bash
# Frontend (desde la carpeta /Frontend/mi-tienda-pintura)
npm test

# Backend (desde la carpeta /backend-pintureria)
npm test

# E2E (desde la carpeta /Frontend/mi-tienda-pintura, requiere el frontend corriendo)
npm run cypress:open
```

### ⚙️ Configuración y Ejecución Local

Necesitarás Node.js y una base de datos PostgreSQL.

#### Backend

```bash
# Navega a la carpeta del backend
cd backend-pintureria

# Instala las dependencias
npm install

# Crea un archivo .env y configúralo (ver sección abajo)

# Inicia el servidor
npm start
```

#### Frontend

```bash
# Navega a la carpeta del frontend
cd Frontend/mi-tienda-pintura

# Instala las dependencias
npm install

# Crea un archivo .env.local y configúralo (ver sección abajo)

# Inicia la aplicación
npm run dev
```

### 🔑 Variables de Entorno

Deberás crear los siguientes archivos .env para que el proyecto funcione localmente y en tus despliegues. ¡Reemplaza tudominio.com y api.tudominio.com con tus dominios reales!

#### Backend (backend-pintureria/.env)

```
# Base de Datos (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:port/database"

# Entorno de la aplicación (development | production | test)
# Define el comportamiento de la aplicación, incluyendo las políticas de CORS.
NODE_ENV="development" 

# Caché (Redis)
REDIS_URL="redis://localhost:6379"

# Autenticación
JWT_SECRET="un_secreto_muy_largo_y_dificil_de_adivinar"
JWT_SECRET_PREVIOUS="un_secreto_anterior_para_rotacion_de_claves_opcional" # Opcional, para rotación de claves

# Mercado Pago (Credenciales de PRUEBA o PRODUCCIÓN)
MERCADOPAGO_ACCESS_TOKEN="TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" # O tu token de producción

# Email (Resend)
EMAIL_HOST="smtp.resend.com"
EMAIL_PORT=465
EMAIL_USER="resend"
EMAIL_PASS="tu_api_key_de_resend"

# URLs de la aplicación
# Asegúrate de que VITE_FRONTEND_URL apunte a tu dominio de frontend (Vercel)
VITE_FRONTEND_URL="[https://www.nrlsb.com](https://www.nrlsb.com)" # ¡REEMPLAZA con tu dominio real!
BACKEND_URL="[https://api.nrlsb.com](https://api.nrlsb.com)" # ¡REEMPLAZA con tu subdominio de API real!

# Clave de API para Google Gemini
GEMINI_API_KEY="tu_api_key_de_gemini"

# Google Cloud Storage (una de las dos opciones)
GCS_KEYFILE="ruta/a/tu/archivo-de-claves.json" # Para desarrollo local
GCS_KEYFILE_CONTENT='contenido_del_json_en_una_linea' # Para producción (Render)
GCS_PROJECT_ID="tu-id-de-proyecto-gcs"
GCS_BUCKET_NAME="nombre-de-tu-bucket"

# Código postal de origen para el cálculo de envío
SHIPPING_API_ORIGIN_POSTAL_CODE="3080"

# Google OAuth
GOOGLE_CLIENT_ID="tu_google_client_id"
GOOGLE_CLIENT_SECRET="tu_google_client_secret"
```

#### Frontend (Frontend/mi-tienda-pintura/.env.local)

```
# URL del Backend
VITE_API_URL="[https://api.nrlsb.com](https://api.nrlsb.com)" # ¡REEMPLAZA con tu subdominio de API real!

# Llave pública de Mercado Pago (Public Key de PRUEBA o PRODUCCIÓN)
VITE_MERCADOPAGO_PUBLIC_KEY="TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" # O tu Public Key de producción
