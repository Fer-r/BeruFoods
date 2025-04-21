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

USER www-data

# Copy composer files first
COPY backend/composer.json backend/composer.lock /var/www/backend/

# Install dependencies (as www-data, creating vendor dir with correct permissions)
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

# Copy the rest of the application code AFTER installing dependencies
COPY --chown=www-data:www-data backend/ /var/www/backend/

RUN chmod +x bin/console

EXPOSE 9000
CMD ["php-fpm"]
