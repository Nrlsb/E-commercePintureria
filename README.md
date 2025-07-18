# E-commerce "Pinturerías Mercurio" - Proyecto Full-Stack

¡Bienvenido al repositorio del proyecto "Pinturerías Mercurio"! Esta es una aplicación de e-commerce completa, desarrollada con un stack tecnológico moderno, una arquitectura robusta y un fuerte enfoque en la seguridad, el rendimiento y la automatización de procesos. La plataforma ofrece una experiencia de compra integral para los clientes y herramientas de gestión potentes para los administradores.

**Sitio en Producción:** [https://e-commerce-pintureria.vercel.app/](https://e-commerce-pintureria.vercel.app/)

---

### 📖 Guía del Proyecto
* [Visión General](#-visión-general)
* [Funcionalidades Clave](#-funcionalidades-clave)
* [Stack Tecnológico](#️-stack-tecnológico)
* [Arquitectura y Seguridad](#-arquitectura-y-seguridad)
* [Flujos de Datos Detallados](#-flujos-de-datos-detallados)
* [Pruebas Automatizadas](#-pruebas-automatizadas)
* [Configuración y Ejecución Local](#️-configuración-y-ejecución-local)
* [Variables de Entorno](#-variables-de-entorno)

---

### 🚀 Visión General

Este proyecto simula una tienda online real, permitiendo a los usuarios navegar por un catálogo de productos, realizar búsquedas y filtros, gestionar su carrito de compras y realizar pagos a través de múltiples métodos. La integración de pagos se realiza a través de **Mercado Pago (Checkout API)** y se complementa con un sistema de pago por transferencia bancaria offline.

Por otro lado, los administradores tienen acceso a un panel privado con herramientas avanzadas para gestionar el inventario, supervisar las ventas con filtros y búsquedas, y moderar el contenido del sitio. La aplicación está diseñada priorizando la experiencia de usuario, el rendimiento (con técnicas como *Lazy Loading*) y la seguridad, incluyendo la automatización de notificaciones y la gestión de órdenes pendientes.

---

### ✨ Funcionalidades Clave

#### Para Clientes
* **Catálogo de Productos:** Navegación intuitiva por categorías, búsqueda por texto y un sistema de filtros avanzados por marca y rango de precios.
* **Gestión de Cuentas:** Registro, inicio de sesión (con JWT) y un flujo completo de recuperación de contraseña vía email.
* **Carrito de Compras Persistente:** Funcionalidad completa para añadir, actualizar y eliminar productos. El estado del carrito persiste en `localStorage` gracias a Zustand.
* **Múltiples Métodos de Pago:**
    * **Mercado Pago:** Pago seguro con tarjeta de crédito/débito y saldo en cuenta.
    * **Transferencia Bancaria:** Opción de pago offline con instrucciones claras.
* **Sistema de Cupones de Descuento:** Aplicación de cupones de porcentaje o de monto fijo en el carrito de compras.
* **Cálculo de Envío:** Estimación de costos de envío basada en el código postal.
* **Sistema de Reseñas y Calificaciones:** Los usuarios autenticados pueden calificar productos y dejar comentarios.
* **Notificaciones por Email Automatizadas:**
    * Confirmación de compra exitosa.
    * Instrucciones detalladas para pagos por transferencia.
    * Recordatorio de pago para órdenes pendientes.
    * Notificación de cancelación de orden por falta de pago.
* **Historial de Compras:** Acceso a un historial de compras detallado desde el perfil del usuario.

#### Para Administradores
* **Panel de Administración Seguro:** Un área privada (`/admin`) protegida por rol de administrador a nivel de API.
* **Gestión de Productos (CRUD):** Control total para crear, leer, actualizar y eliminar productos.
* **Gestión de Órdenes Avanzada:**
    * Visualización de todas las órdenes con filtros por estado y búsqueda por ID o email.
    * **Detalle de Orden en Modal:** Acceso rápido a los detalles completos de una orden sin salir de la página principal.
* **Gestión de Pagos Offline:** Botón para confirmar manualmente la recepción de pagos por transferencia, actualizando el estado de la orden.
* **Cancelación y Reembolsos:** Capacidad para cancelar órdenes aprobadas, procesando automáticamente un reembolso completo a través de la API de Mercado Pago.
* **Sistema de Cancelación Automatizado:** Una tarea programada (Cron Job) se ejecuta periódicamente para cancelar órdenes por transferencia no pagadas y reponer el stock automáticamente.
* **Moderación de Contenido:** Permiso para eliminar reseñas de cualquier producto.
* **Funcionalidades con IA (Gemini):**
    * **Creación Masiva de Productos:** Sube múltiples imágenes de productos y la IA de Gemini generará automáticamente un nombre, descripción y categoría para cada uno.
    * **Asociación Inteligente de Imágenes:** Sube imágenes y la IA las asociará con los productos existentes en el catálogo, utilizando el contexto de la base de datos para una mayor precisión.

---

### 🛠️ Stack Tecnológico

| Capa | Tecnologías Clave |
| :--- | :--- |
| **Frontend** | React (con Vite), React Router, **Zustand** (gestión de estado), Tailwind CSS. |
| **Backend** | Node.js, Express.js, JWT, bcrypt.js, Nodemailer, Cors, Dotenv, **node-cron**, **Winston** (Logging). |
| **Base de Datos** | PostgreSQL (gestionada a través de Render). |
| **Pruebas** | **Vitest** y **React Testing Library** (Frontend), **Jest** y **Supertest** (Backend), **Cypress** (End-to-End). |
| **Infraestructura** | **Vercel** (Despliegue Frontend), **Render** (Despliegue Backend y Base de Datos). |
| **Pasarela de Pagos**| Mercado Pago (Checkout API - Bricks). |
| **Servicio de Email** | Resend. |
| **IA Generativa** | **Google Gemini API** para el análisis de imágenes y generación de texto. |

---

### 🏗️ Arquitectura y Seguridad

El proyecto está estructurado en dos partes principales: un frontend SPA y un backend RESTful.

#### Frontend (React)
Construido con Vite, sigue una arquitectura basada en componentes con una clara separación de responsabilidades:
* **`components`**: Componentes de UI reutilizables.
* **`pages`**: Vistas principales de la aplicación, cargadas con `React.lazy()` para optimizar el rendimiento.
* **`stores`**: Gestión de estado global centralizada con **Zustand**, utilizando el middleware `persist` para mantener el estado del carrito y la autenticación.

#### Backend (Node.js)
API RESTful modularizada para facilitar el mantenimiento:
* **`routes`**: Definen los endpoints de la API.
* **`controllers`**: Contienen la lógica de negocio.
* **`middlewares`**: Funciones para manejar la autenticación (JWT), autorización por roles (`isAdmin`) y un **manejador de errores centralizado**.
* **`services`**: Lógica aislada como el servicio de tareas programadas (`cronService.js`).
* **Logging:** Se utiliza **Winston** para un registro detallado de peticiones y errores, con salida a consola y archivos.

La seguridad se maneja a nivel de API y de base de datos:
* **Validación de Tokens JWT:** Para proteger rutas y asegurar que los usuarios solo puedan acceder a sus propios datos.
* **Seguridad a Nivel de Base de Datos:** Implementación de **Row-Level Security (RLS)** en PostgreSQL para un control de acceso a datos granular y seguro.

---

### 🌊 Flujos de Datos Detallados

#### Flujo de Pago por Transferencia
1.  **Selección y Confirmación (Frontend):** El usuario elige "Transferencia Bancaria" en el checkout y confirma la orden.
2.  **Creación de Orden (Backend):** El frontend llama a `POST /api/orders/bank-transfer`. El backend verifica el stock, crea una orden con estado `pending_transfer`, reserva el stock de los productos y envía un email con las instrucciones de pago.
3.  **Confirmación Manual (Admin):** El administrador verifica el pago en la cuenta bancaria y hace clic en "Confirmar Pago" en el panel de administración.
4.  **Actualización de Orden (Backend):** Se llama a `POST /api/orders/:orderId/confirm-payment`. El backend actualiza el estado de la orden a `approved` y envía un email de confirmación de pago al cliente.
5.  **Flujo de Cancelación (Cron Job):** Una tarea programada se ejecuta cada hora. Si una orden sigue en `pending_transfer` después de 48 horas, el sistema la cancela, repone el stock y notifica al cliente por email.

---

### 🧪 Pruebas Automatizadas

El proyecto cuenta con una estrategia de pruebas multinivel:
* **Pruebas Unitarias y de Integración (Frontend):** Con **Vitest** y **React Testing Library**.
* **Pruebas de API (Backend):** Con **Jest** y **Supertest**.
* **Pruebas End-to-End (E2E):** Con **Cypress** para simular flujos de usuario completos.

**Comandos para ejecutar las pruebas:**
```bash
# Frontend (desde la carpeta /Frontend/mi-tienda-pintura)
npm test

# Backend (desde la carpeta /backend-pintureria)
npm test

# E2E (desde la carpeta /Frontend/mi-tienda-pintura, requiere el frontend corriendo)
npm run cypress:open
⚙️ Configuración y Ejecución LocalNecesitarás Node.js y una base de datos PostgreSQL.1. Backend# Navega a la carpeta del backend
cd backend-pintureria

# Instala las dependencias
npm install

# Crea un archivo .env y configúralo (ver sección abajo)

# Inicia el servidor
npm start
2. Frontend# Navega a la carpeta del frontend
cd Frontend/mi-tienda-pintura

# Instala las dependencias
npm install

# Crea un archivo .env.local y configúralo (ver sección abajo)

# Inicia la aplicación
npm run dev
🔑 Variables de EntornoDeberás crear los siguientes archivos .env para que el proyecto funcione localmente.Backend (backend-pintureria/.env)# Base de Datos (PostgreSQL) - Usa la Connection String de Render o tu BD local
DATABASE_URL="postgresql://user:password@host:port/database"

# Autenticación
JWT_SECRET="un_secreto_muy_largo_y_dificil_de_adivinar"

# Mercado Pago (Credenciales de PRUEBA)
MERCADOPAGO_ACCESS_TOKEN="TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# Email (Ej: Resend)
EMAIL_HOST="smtp.resend.com"
EMAIL_PORT=465
EMAIL_USER="resend"
EMAIL_PASS="tu_api_key_de_resend"

# URLs de la aplicación
VITE_FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:5001"

# Clave de API para Google Gemini
GEMINI_API_KEY="tu_api_key_de_gemini"
Frontend (Frontend/mi-tienda-pintura/.env.local)# URL del Backend
VITE_API_URL="http://localhost:5001"

# Llave pública de Mercado Pago (Public Key de PRUEBA)
VITE_MERCADOPAGO_PUBLIC_KEY="TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
