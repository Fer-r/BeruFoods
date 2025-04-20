# Use the standard Debian-based PHP-FPM image
FROM php:8.2-fpm

# Set working directory
WORKDIR /var/www/backend

# Ensure www-data owns the working directory
RUN chown www-data:www-data /var/www/backend

# Install system dependencies required by PHP extensions FIRST
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    git \
    curl \
    libzip-dev \
    zip \
    acl \
    openssl \
    libicu-dev \
    && rm -rf /var/lib/apt/lists/*

# Configure and Install PHP extensions AFTER dependencies are installed
RUN docker-php-ext-configure intl \
    && docker-php-ext-install -j$(nproc) \
    pdo \
    pdo_mysql \
    zip \
    intl \
    opcache

# Install Composer globally
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Define Composer home and create cache directory owned by www-data
ENV COMPOSER_HOME=/var/www/backend/var/cache/composer
RUN mkdir -p $COMPOSER_HOME && chown -R www-data:www-data /var/www/backend/var

# Use the default www-data user provided by the base image (usually UID/GID 33)
# RUN addgroup -g 82 -S www-data && adduser -u 82 -G www-data -S -D www-data # Removed Alpine-specific user creation
USER www-data

# Copy composer files first
COPY backend/composer.json backend/composer.lock /var/www/backend/

# Install dependencies (as www-data, creating vendor dir with correct permissions)
# Added --no-scripts --no-interaction for potentially safer build execution
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

# Copy the rest of the application code AFTER installing dependencies
COPY --chown=www-data:www-data backend/ /var/www/backend/

# Make console executable (now works because www-data owns the file)
RUN chmod +x bin/console

# Fix potential cache/log permissions if needed (Symfony standard)
# RUN chown -R www-data:www-data /var/www/backend/var

# Expose port 9000 and start php-fpm server
EXPOSE 9000
CMD ["php-fpm"]

# Optional: Copy application code - Removed the old COPY/RUN block here 