#Imagen de partida
FROM node:23-alpine
WORKDIR /app

# Copy package files FIRST to leverage Docker cache
COPY frontend/package.json frontend/yarn.lock* ./

# Install dependencies using the lock file
# RUN yarn install --frozen-lockfile

# Copy the rest of the frontend source code
COPY frontend/ .

# Exponer el puerto
EXPOSE 5173
# Comando de inicio
CMD ["yarn", "dev", "--", "--host", "0.0.0.0"] 