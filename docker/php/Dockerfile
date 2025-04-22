# Use the PHP FPM image (provides extensions, but we won't run FPM itself)
FROM php:8.4-fpm

# Set working directory
WORKDIR /var/www/backend

# Install system dependencies (excluding apache2, supervisor)
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    git \
    curl \
    libzip-dev \
    zip \
    acl \
    openssl \
    libicu-dev \
    unzip \
    libpng-dev \
    && rm -rf /var/lib/apt/lists/* \

# Configure and Install PHP extensions
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
# Create the directory first as root, then change ownership
RUN mkdir -p /var/www/backend/var && chown -R www-data:www-data /var/www/backend/var

# Copy composer files first into the WORKDIR
COPY backend/composer.json backend/composer.lock ./

# Change ownership of the whole directory before switching user
RUN chown -R www-data:www-data /var/www/backend

# Switch to www-data user for composer install
USER www-data

# Install dependencies
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

# Switch back to root to copy remaining files
USER root

# Copy the rest of the application code into the WORKDIR
COPY --chown=www-data:www-data backend/ .

# Make console executable
RUN chmod +x /var/www/backend/bin/console

# Expose the port PHP-FPM will listen on
EXPOSE 9000

# Default command to run PHP-FPM
CMD ["php-fpm"]
