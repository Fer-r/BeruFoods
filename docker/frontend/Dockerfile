#Imagen de partida
FROM node:23-alpine
WORKDIR /app
# Instalar dependencias
COPY frontend/package*.json ./
RUN npm install
# Copiar el código fuente
COPY frontend/ .
# Exponer el puerto
EXPOSE 5173
# Comando de inicio
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 