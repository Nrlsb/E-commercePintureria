# E-commerce "Pinturerías Mercurio" - Proyecto Full-Stack

¡Bienvenido al repositorio del proyecto "Pinturerías Mercurio"! Esta es una aplicación de e-commerce completa, desarrollada con un stack tecnológico moderno y una arquitectura robusta y escalable. La plataforma ofrece una experiencia de compra integral para los clientes y herramientas de gestión potentes para los administradores.

**Sitio en Producción:** [https://e-commerce-pintureria.vercel.app/](https://e-commerce-pintureria.vercel.app/)

---

### 📖 Guía del Proyecto
* [Visión General](#-visión-general)
* [Funcionalidades Clave](#-funcionalidades-clave)
* [Stack Tecnológico](#️-stack-tecnológico)
* [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
* [Flujos de Datos Detallados](#-flujos-de-datos-detallados)
* [Pruebas Automatizadas](#-pruebas-automatizadas)
* [Configuración y Ejecución Local](#️-configuración-y-ejecución-local)
* [Variables de Entorno](#-variables-de-entorno)

---

### 🚀 Visión General

Este proyecto simula una tienda online real, permitiendo a los usuarios navegar por un catálogo de productos, realizar búsquedas y filtros, gestionar su carrito de compras y realizar pagos seguros a través de **Mercado Pago**. Por otro lado, los administradores tienen acceso a un panel privado para gestionar el inventario, supervisar las ventas y moderar el contenido del sitio.

La aplicación está diseñada con un enfoque en el rendimiento, la experiencia de usuario y la mantenibilidad del código.

---

### ✨ Funcionalidades Clave

#### Para Clientes
* **Catálogo de Productos:** Navegación intuitiva por categorías, búsqueda por texto y un sistema de filtros avanzados por marca y rango de precios.
* **Gestión de Cuentas de Usuario:** Registro, inicio de sesión (con JWT para la gestión de sesiones) y un flujo completo de recuperación de contraseña vía email.
* **Carrito de Compras Persistente:** Funcionalidad completa para añadir, actualizar la cantidad y eliminar productos. El estado del carrito persiste aunque el usuario recargue la página.
* **Sistema de Reseñas y Calificaciones:** Los usuarios autenticados pueden calificar productos (1 a 5 estrellas) y dejar comentarios.
* **Flujo de Pago Real:** Integración completa con **Mercado Pago (Checkout Pro)** para procesar pagos de forma segura y transparente.
* **Notificaciones Automáticas:** Envío de correos de confirmación al realizar una compra exitosa y para el restablecimiento de contraseña, utilizando **Nodemailer** y **Resend**.
* **Historial de Compras:** Acceso a un historial de compras detallado desde el perfil del usuario.

#### Para Administradores
* **Panel de Administración Seguro:** Un área privada (`/admin`) protegida por rol de administrador.
* **Gestión de Productos (CRUD):** Control total para crear, leer, actualizar y eliminar productos del catálogo a través de una interfaz amigable.
* **Gestión de Órdenes:** Visualización de todas las órdenes realizadas en la tienda, con detalles sobre el cliente, el monto y el estado del pago.
* **Cancelación y Reembolsos:** Capacidad para cancelar órdenes aprobadas, procesando automáticamente un reembolso completo al cliente a través de la API de Mercado Pago.
* **Moderación de Contenido:** Permiso para eliminar reseñas de cualquier producto.

---

### 🛠️ Stack Tecnológico

| Capa | Tecnologías Clave |
| :--- | :--- |
| **Frontend** | React (con Vite), React Router, **Zustand** (para gestión de estado global y persistente), Tailwind CSS. |
| **Backend** | Node.js, Express.js, PostgreSQL, JWT, bcrypt.js, Nodemailer, Cors, Dotenv. |
| **Base de Datos** | PostgreSQL (gestionada a través de Supabase/Render). |
| **Pruebas** | **Vitest** y **React Testing Library** (Frontend Unit/Integration), **Jest** y **Supertest** (Backend API), **Cypress** (End-to-End). |
| **Infraestructura** | **Vercel** (Despliegue Frontend), **Render** (Despliegue Backend y Base de Datos). |
| **Pasarela de Pagos**| Mercado Pago. |
| **Servicio de Email** | Resend. |

---

### 🏗️ Arquitectura del Proyecto

#### Frontend
La aplicación de frontend está construida como una **Single Page Application (SPA)** con Vite y React. Sigue una arquitectura basada en componentes, con una clara separación de responsabilidades:
* **`components`**: Componentes de UI reutilizables.
* **`pages`**: Componentes que representan las vistas principales de la aplicación.
* **`stores`**: Gestión de estado global centralizada con **Zustand**, utilizando `persist` middleware para mantener el estado del carrito y la autenticación en el `localStorage`.

#### Backend
El backend es una **API RESTful** construida con Node.js y Express. Se ha refactorizado a una **arquitectura modular** para mejorar la mantenibilidad:
* **`routes`**: Definen los endpoints de la API para cada recurso (productos, auth, órdenes).
* **`controllers`**: Contienen la lógica de negocio para cada ruta, interactuando con la base de datos y los servicios.
* **`middlewares`**: Funciones para manejar la autenticación (JWT) y la autorización (roles).
* **`services`**: Lógica externa, como el envío de correos.

---

### 🌊 Flujos de Datos Detallados

#### Proceso de Compra
1.  **Checkout (Frontend):** El usuario inicia el proceso de pago desde el carrito.
2.  **Creación de Preferencia (Backend):** La API recibe los datos del carrito, crea una orden en estado `pending` en la base de datos y genera una "preferencia de pago" en Mercado Pago.
3.  **Pago (Frontend):** El componente de Mercado Pago se renderiza en la página de checkout. El usuario completa el pago en la interfaz segura de Mercado Pago.
4.  **Notificación (Webhook):** Mercado Pago envía una notificación automática a una ruta específica del backend (`/api/payment/notification`) para informar que el pago fue `approved`.
5.  **Confirmación (Backend):** El servidor recibe el webhook, verifica la información, actualiza el estado de la orden a `approved`, descuenta el stock de los productos y utiliza Nodemailer para enviar un email de confirmación.

#### Proceso de Recuperación de Contraseña
1.  **Solicitud (Frontend):** El usuario introduce su email en la página de "Olvidé mi contraseña".
2.  **Generación de Token (Backend):** El backend genera un token seguro y de corta duración, lo guarda hasheado en la base de datos y lo envía al email del usuario.
3.  **Reseteo (Frontend):** El usuario hace clic en el enlace del email y es dirigido a una página para introducir su nueva contraseña.
4.  **Actualización (Backend):** El backend verifica el token, hashea la nueva contraseña y actualiza el registro del usuario.

---

### 🧪 Pruebas Automatizadas

El proyecto cuenta con una estrategia de pruebas multinivel para garantizar la calidad y estabilidad del código:
* **Pruebas Unitarias y de Integración (Frontend):** Ubicadas en `/src/tests`, utilizan **Vitest** y **React Testing Library** para probar componentes y stores de forma aislada.
* **Pruebas de API (Backend):** Ubicadas en `/backend-pintureria/tests`, utilizan **Jest** y **Supertest** para verificar la lógica de los endpoints.
* **Pruebas End-to-End (E2E):** Ubicadas en `/cypress/e2e`, utilizan **Cypress** para simular flujos de usuario completos (búsqueda, proceso de compra) en un navegador real.

**Comandos para ejecutar las pruebas:**
```bash
# Para pruebas de Frontend (unitarias)
npm test

# Para pruebas End-to-End (requiere tener el frontend corriendo)
npm run cypress:open
```

---

### ⚙️ Configuración y Ejecución Local

Para ejecutar este proyecto en tu máquina local, necesitarás tener instalados **Node.js** y **PostgreSQL**.

#### 1. Backend
```bash
# Navega a la carpeta del backend
cd backend-pintureria

# Instala las dependencias
npm install

# Crea un archivo .env en la raíz de esta carpeta y configúralo.
# (Ver la sección de Variables de Entorno más abajo)

# Inicia el servidor de desarrollo
npm start
```

#### 2. Frontend
```bash
# Navega a la carpeta del frontend
cd Frontend/mi-tienda-pintura

# Instala las dependencias
npm install

# Crea un archivo .env.local en la raíz de esta carpeta y configúralo.
# (Ver la sección de Variables de Entorno más abajo)

# Inicia la aplicación de React
npm run dev
```

---

### 🔑 Variables de Entorno

Deberás crear los siguientes archivos `.env` para que el proyecto funcione localmente.

#### Backend (`backend-pintureria/.env`)
```env
# Base de Datos (PostgreSQL)
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=nombre_de_tu_bd
DB_PASSWORD=tu_contraseña
DB_PORT=5432

# Autenticación
JWT_SECRET=un_secreto_muy_largo_y_dificil_de_adivinar

# Mercado Pago (Usa credenciales de PRUEBA para desarrollo)
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Email (Configuración para Nodemailer, ej: Resend)
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=465
EMAIL_USER=resend
EMAIL_PASS=tu_api_key_de_resend

# URLs de la aplicación (Importante para el webhook y redirecciones)
VITE_FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5001
```

#### Frontend (`Frontend/mi-tienda-pintura/.env.local`)
```env
# URL del Backend
VITE_API_URL=http://localhost:5001

# Llave pública de Mercado Pago (Usa la Public Key de PRUEBA)
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

¡Gracias por revisar el proyecto!
