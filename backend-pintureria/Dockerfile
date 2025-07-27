# backend-pintureria/Dockerfile

# Usar una imagen base de Node.js
# Se recomienda usar la versión LTS más reciente para estabilidad.
FROM node:20-alpine AS development

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar los archivos package.json y package-lock.json
# Esto permite que Docker cachee la instalación de dependencias.
COPY package*.json ./

# Instalar las dependencias del proyecto
# Usamos --omit=dev para no instalar dependencias de desarrollo en producción.
RUN npm install --omit=dev

# Copiar el resto del código de la aplicación al contenedor
COPY . .

# Exponer el puerto en el que la aplicación Express escucha
# Asegúrate de que este puerto coincida con el PORT configurado en tu backend (config/index.js)
EXPOSE 5001

# Comando para iniciar la aplicación
# npm start ejecuta node server.js
CMD ["npm", "start"]

# --- Etapa de construcción para producción (opcional, si se necesita una imagen más pequeña sin dependencias de desarrollo) ---
# FROM node:20-alpine AS production
# WORKDIR /app
# COPY package*.json ./
# RUN npm install --omit=dev
# COPY . .
# EXPOSE 5001
# CMD ["npm", "start"]
