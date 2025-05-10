# Use the official Nginx image
FROM nginx:stable-alpine

# Install openssl and create certs dir (needed for the entrypoint script)
RUN apk --no-cache add openssl && \
    mkdir -p /etc/nginx/certs

# Copy the entrypoint script
COPY entrypoint.sh /entrypoint.sh

# Make it executable
RUN chmod +x /entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]
