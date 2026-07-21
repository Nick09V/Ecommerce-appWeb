# Usamos la misma imagen base ligera
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Copiamos package.json y package-lock.json
COPY package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos el resto del código del BFF Admin
COPY . .

# Exponemos el puerto
EXPOSE 3000

# Comando para iniciar el microservicio Admin
CMD ["node", "src/index.js"]