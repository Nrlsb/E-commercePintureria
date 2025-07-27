# Frontend/mi-tienda-pintura/Dockerfile

# Etapa 1: Construir la aplicación React
FROM node:20-alpine AS build

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar los archivos package.json y package-lock.json
COPY package*.json ./

# Instalar las dependencias
RUN npm install

# Copiar el resto del código de la aplicación
COPY . .

# Construir la aplicación React para producción
# El VITE_API_URL se inyectará en tiempo de ejecución a través de Docker Compose
# o el entorno de despliegue, no durante la construcción de la imagen.
RUN npm run build

# Etapa 2: Servir la aplicación con Nginx
FROM nginx:alpine

# Copiar la configuración personalizada de Nginx (si es necesario)
# Si no tienes una configuración específica, Nginx servirá los archivos por defecto.
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Eliminar el contenido predeterminado del directorio de Nginx
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copiar los archivos de construcción de React al directorio de servicio de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar la configuración de Nginx para Vercel (si aplica, para rewrites)
# Asegúrate de que vercel.json se ha convertido a una configuración de Nginx adecuada si es compleja.
# Para rewrites simples, el default.conf de Nginx puede ser suficiente o se puede crear un archivo nginx.conf
# que maneje los rewrites.
COPY vercel.json /usr/share/nginx/html/vercel.json
# Nota: vercel.json no es una configuración de Nginx. Si necesitas rewrites,
# deberías crear un archivo nginx.conf que los implemente y copiarlo aquí.
# Ejemplo simple de nginx.conf para rewrites de SPA:
# server {
#   listen 80;
#   location / {
#     root /usr/share/nginx/html;
#     index index.html index.htm;
#     try_files $uri $uri/ /index.html;
#   }
# }
# Si usas el ejemplo anterior, entonces: COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80 de Nginx
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
