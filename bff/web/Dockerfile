# Usamos una imagen ligera de Node.js
FROM node:20-alpine

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos primero los archivos de dependencias para aprovechar el caché de Docker
COPY package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos el resto del código fuente (la carpeta src)
COPY . .

# Exponemos el puerto en el que correrá el servicio (3000 por defecto en tu .env)
EXPOSE 3000

# Comando para iniciar el microservicio
CMD ["node", "src/index.js"]