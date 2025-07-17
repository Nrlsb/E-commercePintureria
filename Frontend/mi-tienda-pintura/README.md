# E-commerce "Pinturerías Mercurio" - Proyecto Full-Stack

¡Bienvenido al repositorio del proyecto "Pinturerías Mercurio"! Esta es una aplicación de e-commerce completa, desarrollada con un stack tecnológico moderno, una arquitectura robusta y un fuerte enfoque en la seguridad y el rendimiento. La plataforma ofrece una experiencia de compra integral para los clientes y herramientas de gestión potentes para los administradores.

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

Este proyecto simula una tienda online real, permitiendo a los usuarios navegar por un catálogo de productos, realizar búsquedas y filtros, gestionar su carrito de compras y realizar pagos seguros. La integración de pagos se realiza a través de **Mercado Pago**, utilizando **Checkout API (Bricks)** para ofrecer una experiencia de pago integrada y segura directamente en el sitio.

Por otro lado, los administradores tienen acceso a un panel privado para gestionar el inventario, supervisar las ventas y moderar el contenido del sitio. La aplicación está diseñada priorizando la experiencia de usuario, el rendimiento (con técnicas como *Lazy Loading*) y la seguridad.

---

### ✨ Funcionalidades Clave

#### Para Clientes
* **Catálogo de Productos:** Navegación intuitiva por categorías, búsqueda por texto y un sistema de filtros avanzados por marca y rango de precios.
* **Gestión de Cuentas de Usuario:** Registro, inicio de sesión (con JWT para la gestión de sesiones) y un flujo completo de recuperación de contraseña vía email.
* **Carrito de Compras Persistente:** Funcionalidad completa para añadir, actualizar la cantidad y eliminar productos. El estado del carrito persiste en el `localStorage` gracias a Zustand.
* **Cálculo de Envío:** Estimación de costos de envío basada en el código postal del cliente.
* **Sistema de Reseñas y Calificaciones:** Los usuarios autenticados pueden calificar productos (1 a 5 estrellas) y dejar comentarios.
* **Flujo de Pago Integrado:** Integración completa con **Mercado Pago (Checkout API)**, permitiendo a los usuarios pagar con tarjeta de crédito o débito sin abandonar el sitio.
* **Notificaciones Automáticas:** Envío de correos de confirmación al realizar una compra y para el restablecimiento de contraseña, utilizando **Nodemailer** y **Resend**.
* **Historial de Compras:** Acceso a un historial de compras detallado desde el perfil del usuario.

#### Para Administradores
* **Panel de Administración Seguro:** Un área privada (`/admin`) protegida por rol de administrador a nivel de API.
* **Gestión de Productos (CRUD):** Control total para crear, leer, actualizar y eliminar productos del catálogo.
* **Gestión de Órdenes:** Visualización de todas las órdenes realizadas en la tienda, con detalles sobre el cliente, el monto y el estado del pago.
* **Cancelación y Reembolsos:** Capacidad para cancelar órdenes aprobadas, procesando automáticamente un reembolso completo al cliente a través de la API de Mercado Pago.
* **Moderación de Contenido:** Permiso para eliminar reseñas de cualquier producto.

---

### 🛠️ Stack Tecnológico

| Capa | Tecnologías Clave |
| :--- | :--- |
| **Frontend** | React (con Vite), React Router, **Zustand** (gestión de estado), Tailwind CSS. |
| **Backend** | Node.js, Express.js, JWT, bcrypt.js, Nodemailer, Cors, Dotenv. |
| **Base de Datos** | PostgreSQL (gestionada a través de Render). |
| **Pruebas** | **Vitest** y **React Testing Library** (Frontend), **Jest** y **Supertest** (Backend), **Cypress** (End-to-End). |
| **Infraestructura** | **Vercel** (Despliegue Frontend), **Render** (Despliegue Backend y Base de Datos). |
| **Pasarela de Pagos**| Mercado Pago (Checkout API - Bricks). |
| **Servicio de Email** | Resend. |

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
* **`middlewares`**: Funciones para manejar la autenticación (JWT) y la autorización por roles (`isAdmin`).

La seguridad se maneja a nivel de API, validando tokens JWT para proteger rutas y asegurar que los usuarios solo puedan acceder a sus propios datos, mientras que los administradores tienen permisos elevados.

---

### 🌊 Flujos de Datos Detallados

#### Proceso de Compra (Checkout API)
1.  **Checkout (Frontend):** El usuario navega a la página de checkout. La página verifica que el monto total sea superior al mínimo requerido por Mercado Pago.
2.  **Renderizado del Formulario:** Se renderiza el brick `CardPayment` de Mercado Pago, que proporciona un formulario seguro para ingresar los datos de la tarjeta.
3.  **Envío de Formulario (Frontend):** Al enviar, el brick tokeniza de forma segura los datos de la tarjeta y los devuelve junto con la información del pagador.
4.  **Procesamiento del Pago (Backend):** El frontend envía el token y los detalles de la compra a la ruta `POST /api/orders/process-payment`. El backend:
    a. Crea una orden en la base de datos con estado `pending`.
    b. Envía la información del pago (incluyendo el token) a la API de Mercado Pago.
5.  **Respuesta de Mercado Pago:**
    * **Si el pago es `approved`**: El backend actualiza el estado de la orden a `approved`, descuenta el stock de los productos y envía un email de confirmación. El frontend redirige al usuario a la página de éxito.
    * **Si el pago es rechazado**: El backend revierte la creación de la orden y devuelve un mensaje de error al frontend.

---

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
⚙️ Configuración y Ejecución LocalNecesitarás Node.js y una base de datos PostgreSQL (puedes usar Docker o una instancia local).1. Backend# Navega a la carpeta del backend
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
Frontend (Frontend/mi-tienda-pintura/.env.local)# URL del Backend
VITE_API_URL="http://localhost:5001"

# Llave pública de Mercado Pago (Public Key de PRUEBA)
VITE_MERCADOPAGO_PUBLIC_KEY="TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
