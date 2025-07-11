# E-commerce "Pinturerías Mercurio" - Proyecto Full-Stack

![Imagen del logo de Pinturerías Mercurio](https://i.imgur.com/w9yVb3B.png)

Este repositorio contiene el código fuente de un proyecto de e-commerce completo, desarrollado con el stack MERN (PostgreSQL en lugar de MongoDB) y desplegado en una arquitectura moderna en la nube.

**Sitio en vivo:** [https://e-commerce-pintureria.vercel.app/](https://e-commerce-pintureria.vercel.app/)

---

## 🚀 Funcionalidades Principales

- **Catálogo de Productos:** Navegación por categorías, búsqueda y páginas de detalle rediseñadas.
- **Carrito de Compras:** Funcionalidad completa para añadir, actualizar y eliminar productos.
- **Flujo de Pago Real:** Integración completa con la pasarela de pagos de **Mercado Pago**.
- **Autenticación de Usuarios:** Sistema de registro e inicio de sesión seguro basado en JSON Web Tokens (JWT).
- **Panel de Administración:** Un área privada (`/admin`) para usuarios con rol de administrador que permite:
  - **Crear** nuevos productos.
  - **Editar** productos existentes.
  - **Eliminar** productos del catálogo.
- **Diseño Responsivo:** Interfaz de usuario moderna construida con Tailwind CSS, adaptable a dispositivos móviles y de escritorio.

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 19** (con Vite)
- **React Router DOM** para la navegación.
- **Tailwind CSS** para el diseño de la interfaz.
- **Mercado Pago SDK** para la integración de pagos.

### Backend
- **Node.js** con **Express.js** para la API RESTful.
- **PostgreSQL** como base de datos relacional.
- **bcrypt.js** para el hasheo de contraseñas.
- **JSON Web Tokens (JWT)** para la gestión de sesiones y roles.

### Infraestructura y Despliegue
- **Frontend:** Desplegado en **Vercel**.
- **Backend:** Desplegado en **Render**.
- **Base de Datos:** Alojada en **Supabase**.
- **Repositorio:** GitHub, con despliegue continuo (CI/CD) configurado para Vercel y Render.

---

## ⚙️ Configuración y Ejecución Local

Para ejecutar este proyecto en tu máquina local, necesitarás tener instalados Node.js y PostgreSQL.

### 1. Backend

```bash
# Navega a la carpeta del backend
cd backend-pintureria

# Instala las dependencias
npm install

# Crea un archivo .env en la raíz de esta carpeta y configúralo
# basándote en el archivo .env.example o las guías del proyecto.
# Necesitarás las credenciales de tu base de datos local y de Mercado Pago.

# Inicia el servidor de desarrollo
node server.js
```
El servidor del backend correrá en `http://localhost:5001`.

### 2. Frontend

```bash
# Navega a la carpeta del frontend
cd Frontend/mi-tienda-pintura

# Instala las dependencias
npm install

# Asegúrate de que tu backend esté corriendo.
# No es necesario un archivo .env para el frontend en desarrollo,
# ya que se conecta por defecto a la API en localhost.

# Inicia la aplicación de React
npm run dev
```
La aplicación del frontend correrá en `http://localhost:5173`.

---

¡Gracias por revisar el proyecto!
