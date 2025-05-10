#Imagen de partida
FROM node:23-alpine
WORKDIR /app

# Ensure the /app mountpoint is owned by node within the image before host mount overlays it.
# This prepares the directory in the container if it needs to be created by WORKDIR,
# before Docker overlays your local ./frontend directory onto it.
RUN chown -R node:node /app

# Switch to the node user
USER node

# Install dependencies using the lock file
RUN yarn install

# Copy the rest of the frontend source code

# Exponer el puerto
EXPOSE 5173
# Comando de inicio para mantener el contenedor vivo
CMD ["tail", "-f", "/dev/null"] 