# Use the PHP FPM image (provides extensions, but we won't run FPM itself)
FROM php:8.3-fpm

# Set working directory
WORKDIR /var/www/backend

# Modify www-data UID and GID to 1000 (common for host user)
# This should be done before creating files/dirs that www-data needs to own
RUN usermod -u 1000 www-data && groupmod -g 1000 www-data

# Install system dependencies and PHP extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    acl \
    bash \
    curl \
    git \
    libicu-dev \
    libpng-dev \
    libzip-dev \
    openssl \
    unzip \
    zip \
    && rm -rf /var/lib/apt/lists/* \
    && docker-php-ext-configure intl \
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
# Ensure var/cache and var/log exist and are owned by www-data before potential volume mount overwrites during runtime
# Note: COMPOSER_HOME already creates var/cache/composer
RUN mkdir -p /var/www/backend/var/log \
    && chown -R www-data:www-data /var/www/backend/var

# Copy composer files first into the WORKDIR
COPY backend/composer.json backend/composer.lock ./

# Ensure www-data owns the working directory before composer install
RUN chown -R www-data:www-data /var/www/backend

# Switch to www-data user for composer install
USER www-data

# Install dependencies without running scripts during build
RUN composer install --no-dev --no-interaction --no-scripts

# Generate optimized autoloader separately
RUN composer dump-autoload --optimize --no-dev --classmap-authoritative

# Switch back to root to copy remaining files
USER root

# Copy the entire backend application content
# (Files will be overwritten by the bind mount at runtime for development,
# but this makes the image potentially runnable standalone)
COPY --chown=www-data:www-data backend/ .

# Make console executable
RUN chmod +x /var/www/backend/bin/console

# Ensure final ownership of the entire app directory by www-data
# This is crucial as the COPY backend/ . command runs as root by default
# and we want www-data to own these files.
RUN chown -R www-data:www-data /var/www/backend

# Expose the port PHP-FPM will listen on
EXPOSE 9000

# Switch to www-data user to run FPM (this should now work for logs/cache)
USER www-data

# Default command to run PHP-FPM
CMD ["php-fpm"]
