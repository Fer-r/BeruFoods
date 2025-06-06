# BeruFoods Administration Manual

This manual provides comprehensive instructions for system administrators to deploy, configure, and maintain the BeruFoods platform.

## Table of Contents

- [BeruFoods Administration Manual](#berufoods-administration-manual)
  - [Table of Contents](#table-of-contents)
  - [System Architecture](#system-architecture)
  - [Admin Interface Overview](#admin-interface-overview)
  - [Deployment](#deployment)
    - [Local Development Deployment](#local-development-deployment)
  - [Configuration](#configuration)
    - [Environment Variables](#environment-variables)
      - [Database Configuration](#database-configuration)
      - [JWT Configuration](#jwt-configuration)
      - [Mercure Configuration](#mercure-configuration)
      - [Frontend Configuration](#frontend-configuration)
      - [Symfony Configuration](#symfony-configuration)
    - [Security Configuration](#security-configuration)
      - [JWT Authentication](#jwt-authentication)
      - [CORS Configuration](#cors-configuration)
    - [Database Configuration](#database-configuration-1)
    - [Mercure Configuration](#mercure-configuration-1)
  - [Maintenance](#maintenance)
    - [Backup and Restore](#backup-and-restore)
      - [Database Backup](#database-backup)
      - [File Backup](#file-backup)
    - [Monitoring](#monitoring)
      - [Docker Container Monitoring](#docker-container-monitoring)
      - [Application Monitoring](#application-monitoring)
    - [Logging](#logging)
      - [Symfony Logs](#symfony-logs)
      - [Nginx Logs](#nginx-logs)
    - [Updating](#updating)
      - [Updating Dependencies](#updating-dependencies)
      - [Updating the Application](#updating-the-application)
  - [Troubleshooting](#troubleshooting)
    - [Common Issues](#common-issues)
      - [Database Connection Issues](#database-connection-issues)
      - [JWT Authentication Issues](#jwt-authentication-issues)
      - [Mercure Connection Issues](#mercure-connection-issues)
      - [Frontend Build Issues](#frontend-build-issues)
      - [Admin Interface Issues](#admin-interface-issues)
    - [Debugging Tools](#debugging-tools)
      - [Symfony Debug Tools](#symfony-debug-tools)
      - [Database Debugging](#database-debugging)
      - [Container Debugging](#container-debugging)

## System Architecture

BeruFoods is built using a microservices architecture with the following components:

1. **Frontend**: React application built with Vite
2. **Backend API**: Symfony PHP application
3. **Database**: MySQL
4. **Web Server**: Nginx
5. **Real-time Updates**: Mercure Hub
6. **Database Management**: phpMyAdmin
7. **Admin Interface**: Integrated admin dashboard for platform management

The system is containerized using Docker, with each component running in its own container, orchestrated by Docker Compose.

## Admin Interface Overview

The platform includes a comprehensive admin interface accessible through the web application:

- **Admin Dashboard**: Central navigation hub with visual cards and statistics
- **User Management**: Interface for viewing, editing, and banning user accounts
- **Restaurant Management**: Tools for managing restaurants, orders, and articles
- **Role Management**: Edit user roles with admin-only restrictions
- **Real-time Statistics**: Live counters for total users and restaurants

## Deployment

### Local Development Deployment

For local development, the project uses Docker Compose to create a consistent development environment.

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Fer-r/BeruFoods.git
   cd BeruFoods
   ```

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   # Edit .env with appropriate values
   nano ./frontend/.env
   # Edit frontend/.env with appropriate values   
   ```

3. **Initialize the Project**:
   ```bash
   make init
   ```
   This command will:
   - Build Docker images
   - Start containers
   - Install dependencies
   - Run database migrations
   - Clear and warm up the Symfony cache

4. **Generate JWT Keys**:
   ```bash
   make generate-keys
   ```

5. **Generate Demo Data (Optional)**:
   ```bash
   make demo-data
   ```
   This command can be run multiple times safely - it will skip existing accounts and only create new ones.
   
   This creates:
   - 1 admin user (admin@berufoods.com)
   - 20 users (10 in Granada, 10 in Madrid)
   - 20 restaurants (10 in Granada, 10 in Madrid)
   - 5 menu items per restaurant
   
   All addresses are realistic and match actual coordinates for locations in Granada and Madrid.

6. **Access the Admin Interface**:
   - Log in with admin credentials: `admin@berufoods.com` / `password123`
   - Navigate to the admin dashboard through the header menu
   - Use the admin interface to manage users and restaurants

7. **Access the Application**:
   - Frontend: [http://localhost](http://localhost)
   - Backend API: [http://localhost/api](http://localhost/api)
   - phpMyAdmin: [http://localhost/phpmyadmin](http://localhost/phpmyadmin)

8. **Demo Account Credentials**:
   All demo accounts use the password: `password123`
   
   - **Administrator**: `admin@berufoods.com` (Full admin dashboard access)
   - **Demo Users**: `user1@example.com` through `user20@example.com`
   - **Demo Restaurants**: `restaurant1@example.com` through `restaurant20@example.com`

9. **Admin Dashboard Features**:
   - Navigate to the admin dashboard after logging in as admin
   - Use the dashboard to access user and restaurant management
   - View real-time statistics and platform overview
   - Manage user roles and permissions through the web interface

## Configuration

### Environment Variables

The BeruFoods platform uses environment variables for configuration. Here's a comprehensive list:

#### Database Configuration
- `MYSQL_DATABASE`: Database name
- `MYSQL_USER`: Database user
- `MYSQL_PASSWORD`: Database password
- `MYSQL_ROOT_PASSWORD`: Database root password
- `DB_DRIVER`: Database driver (pdo_mysql)
- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `DB_NAME`: Database name (same as MYSQL_DATABASE)
- `DB_USER`: Database user (same as MYSQL_USER)
- `DB_PASSWORD`: Database password (same as MYSQL_PASSWORD)
- `DB_SERVER_VERSION`: MySQL server version

#### JWT Configuration
- `JWT_PASSPHRASE`: Passphrase for JWT private key

#### Mercure Configuration
- `MERCURE_JWT_SECRET`: Secret for Mercure JWT
- `MERCURE_URL`: URL for Mercure hub (internal)
- `MERCURE_PUBLIC_URL`: Public URL for Mercure hub (client-facing)

#### Frontend Configuration
- `VITE_URL_API`: URL for the backend API
- `VITE_GOOGLE_MAPS_API_KEY`: Google Maps API key

#### Symfony Configuration
- `APP_ENV`: Environment (dev, prod, test)
- `APP_SECRET`: Symfony application secret
- `CORS_ALLOW_ORIGIN`: CORS allowed origins

### Security Configuration

#### JWT Authentication

BeruFoods uses Lexik JWT Authentication Bundle for secure API authentication:

1. **Generate JWT Keys**:
   ```bash
   make generate-keys
   ```
   Or manually:
   ```bash
   docker compose exec --user=www-data backend bin/console lexik:jwt:generate-keypair --overwrite
   ```

2. **JWT Configuration**:
   The JWT configuration is in `backend/config/packages/lexik_jwt_authentication.yaml`:
   ```yaml
   lexik_jwt_authentication:
       secret_key: '%env(resolve:JWT_SECRET_KEY)%'
       public_key: '%env(resolve:JWT_PUBLIC_KEY)%'
       pass_phrase: '%env(JWT_PASSPHRASE)%'
       token_ttl: 259200  # 3 days
   ```

#### CORS Configuration

CORS is configured in `backend/config/packages/nelmio_cors.yaml`:
```yaml
nelmio_cors:
    defaults:
        allow_credentials: true
        origin_regex: true
        allow_origin: ['%env(CORS_ALLOW_ORIGIN)%']
        allow_methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE']
        allow_headers: ['Content-Type', 'Authorization']
        expose_headers: ['Link']
        max_age: 3600
```

### Database Configuration

The database configuration is managed through environment variables and Docker Compose:

1. **Docker Compose Configuration**:
   ```yaml
   database:
     image: mysql:8.0
     environment:
       MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
       MYSQL_DATABASE: ${MYSQL_DATABASE}
       MYSQL_USER: ${MYSQL_USER}
       MYSQL_PASSWORD: ${MYSQL_PASSWORD}
     volumes:
       - database_data:/var/lib/mysql
   ```

2. **Symfony Database Configuration**:
   In `backend/config/packages/doctrine.yaml`:
   ```yaml
   doctrine:
       dbal:
           driver: '%env(DB_DRIVER)%'
           host: '%env(DB_HOST)%'
           port: '%env(int:DB_PORT)%'
           dbname: '%env(DB_NAME)%'
           user: '%env(DB_USER)%'
           password: '%env(DB_PASSWORD)%'
           server_version: '%env(DB_SERVER_VERSION)%'
   ```

### Mercure Configuration

Mercure is used for real-time updates and notifications:

1. **Docker Compose Configuration**:
   ```yaml
   mercure:
     image: dunglas/mercure
     restart: unless-stopped
     environment:
       SERVER_NAME: ':3000'
       MERCURE_PUBLISHER_JWT_KEY: ${MERCURE_JWT_SECRET}
       MERCURE_SUBSCRIBER_JWT_KEY: ${MERCURE_JWT_SECRET}
       MERCURE_EXTRA_DIRECTIVES: |
         cors_origins https://localhost:5173 http://localhost:5173
   ```

2. **Symfony Mercure Configuration**:
   In `backend/config/packages/mercure.yaml`:
   ```yaml
   mercure:
       hubs:
           default:
               url: '%env(MERCURE_URL)%'
               public_url: '%env(MERCURE_PUBLIC_URL)%'
               jwt:
                   secret: '%env(MERCURE_JWT_SECRET)%'
                   publish: ['*']
                   subscribe: ['*']
   ```

## Maintenance

### Backup and Restore

#### Database Backup

1. **Create a Backup**:
   ```bash
   docker compose exec database mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} > backup_$(date +%Y%m%d%H%M%S).sql
   ```

2. **Restore from Backup**:
   ```bash
   cat backup_file.sql | docker compose exec -T database mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE}
   ```

#### File Backup

1. **Backup Uploaded Files**:
   ```bash
   tar -czvf uploads_backup_$(date +%Y%m%d%H%M%S).tar.gz backend/public/uploads
   ```

2. **Restore Uploaded Files**:
   ```bash
   tar -xzvf uploads_backup_file.tar.gz -C ./
   ```

### Monitoring

#### Docker Container Monitoring

1. **View Container Status**:
   ```bash
   docker compose ps
   ```

2. **View Container Logs**:
   ```bash
   docker compose logs -f
   ```

3. **View Specific Service Logs**:
   ```bash
   docker compose logs -f backend
   docker compose logs -f frontend
   docker compose logs -f database
   docker compose logs -f mercure
   ```

#### Application Monitoring

1. **Symfony Profiler** (Development Environment):
   - Access the Symfony Profiler at `http://localhost/_profiler`
   - View detailed information about requests, performance, and errors

2. **Admin Interface Monitoring**:
   - Access admin dashboard at `http://localhost` (login as admin)
   - Monitor user and restaurant statistics in real-time
   - Track platform usage through the dashboard analytics
   - Manage user roles and permissions through the web interface

3. **Database Monitoring**:
   - Access phpMyAdmin at `http://localhost:8081`
   - Monitor database performance, run queries, and manage tables

### Logging

#### Symfony Logs

Symfony logs are stored in `backend/var/log/`:

1. **Development Logs**:
   - `backend/var/log/dev.log`

2. **Production Logs**:
   - `backend/var/log/prod.log`

3. **Viewing Logs**:
   ```bash
   docker compose exec backend tail -f var/log/dev.log
   ```

#### Nginx Logs

Nginx logs are stored in `docker/nginx/logs/`:

1. **Access Logs**:
   - `docker/nginx/logs/access.log`

2. **Error Logs**:
   - `docker/nginx/logs/error.log`

3. **Viewing Logs**:
   ```bash
   docker compose exec nginx tail -f /var/log/nginx/error.log
   ```

### Updating

#### Updating Dependencies

1. **Backend Dependencies**:
   ```bash
   docker compose exec --user=www-data backend composer update
   ```

2. **Frontend Dependencies**:
   ```bash
   docker compose exec --user=node frontend yarn upgrade
   ```

#### Updating the Application

1. **Pull Latest Changes**:
   ```bash
   git pull origin main
   ```

2. **Rebuild and Restart**:
   ```bash
   make build
   make restart
   ```

3. **Run Migrations**:
   ```bash
   make db
   ```

4. **Clear Cache**:
   ```bash
   make cache
   ```

## Troubleshooting

### Common Issues

#### Database Connection Issues

1. **Check Database Container**:
   ```bash
   docker compose ps database
   ```

2. **Check Database Logs**:
   ```bash
   docker compose logs database
   ```

3. **Verify Environment Variables**:
   Ensure that database environment variables in `.env` match the configuration in `docker-compose.yml` and Symfony's `doctrine.yaml`.

#### JWT Authentication Issues

1. **Regenerate JWT Keys**:
   ```bash
   make generate-keys
   ```

2. **Check JWT Configuration**:
   Verify that `JWT_PASSPHRASE` in `.env` matches the configuration in `lexik_jwt_authentication.yaml`.

#### Mercure Connection Issues

1. **Check Mercure Container**:
   ```bash
   docker compose ps mercure
   ```

2. **Check Mercure Logs**:
   ```bash
   docker compose logs mercure
   ```

3. **Verify Mercure Configuration**:
   Ensure that `MERCURE_JWT_SECRET` is set correctly and that the Mercure URLs are accessible.

#### Frontend Build Issues

1. **Check Frontend Logs**:
   ```bash
   docker compose logs frontend
   ```

2. **Rebuild Frontend**:
   ```bash
   docker compose exec --user=node frontend yarn build
   ```

#### Admin Interface Issues

1. **Admin Access Problems**:
   - Verify admin credentials: `admin@berufoods.com` / `password123`
   - Ensure the admin user has `ROLE_ADMIN` role in the database
   - Check JWT token generation for admin users

2. **Admin Dashboard Not Loading**:
   - Check frontend container status: `docker compose ps frontend`
   - Verify API endpoints are accessible: `curl http://localhost/api/users?limit=1`
   - Check browser console for JavaScript errors

3. **Statistics Not Updating**:
   - Verify API connectivity from frontend to backend
   - Check CORS configuration for admin endpoints
   - Ensure proper authentication headers are being sent

### Debugging Tools

#### Symfony Debug Tools

1. **Symfony Console**:
   ```bash
   docker compose exec backend bin/console
   ```

2. **Symfony Debug Commands**:
   ```bash
   docker compose exec backend bin/console debug:router
   docker compose exec backend bin/console debug:container
   docker compose exec backend bin/console debug:config
   ```

3. **Doctrine Schema Validation**:
   ```bash
   docker compose exec backend bin/console doctrine:schema:validate
   ```

#### Database Debugging

1. **MySQL CLI**:
   ```bash
   docker compose exec database mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE}
   ```

2. **phpMyAdmin**:
   Access phpMyAdmin at `http://localhost:8081`

#### Container Debugging

1. **Shell Access**:
   ```bash
   docker compose exec backend bash
   docker compose exec frontend sh
   docker compose exec database bash
   ```

2. **Container Inspection**:
   ```bash
   docker inspect berufoods-backend-1
   ```

3. **Network Inspection**:
   ```bash
   docker network inspect beru-network
   ```