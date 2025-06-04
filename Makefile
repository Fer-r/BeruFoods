# Makefile for BeruFoods Project

# Variables
BACKEND_SERVICE := backend
FRONTEND_SERVICE := frontend
BACKEND_USER := www-data
FRONTEND_USER := node

# Base Compose command (uses .env file automatically)
COMPOSE := docker compose

# Default target when 'make' is run without arguments
.DEFAULT_GOAL := help

# Phony targets prevent conflicts with files of the same name
.PHONY: help init up down restart build logs-backend logs-frontend bash-backend bash-frontend install db cache cache-clear migration test-backend frontend backend fix-linux-permissions start-frontend-dev-blocking generate-keys deploy deploy-build deploy-up deploy-init

help: ## Display this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Available targets:"
	@echo "  init            Initialize the project: stop, build, start, fix permissions (Linux), install deps, setup DB, warm cache, tail logs"
	@echo "  up              Build images (if needed) and start services in detached mode"
	@echo "  down            Stop and remove containers, networks"
	@echo "  stop            Stop running services"
	@echo "  restart         Stop and start services"
	@echo "  build           Build or rebuild service images"
	@echo "  logs            Tail logs from all services"
	@echo "  logs-backend    Tail logs from the backend service"
	@echo "  logs-frontend   Tail logs from the frontend service"
	@echo "  bash-backend    Connect to the backend container's shell as www-data"
	@echo "  bash-frontend   Connect to the frontend container's shell as ${FRONTEND_USER}"
	@echo "  install         Install backend (Composer) and frontend (yarn) dependencies"
	@echo "  db              Run database migrations"
	@echo "  cache           Clear and warm up the backend cache"
	@echo "  cache-clear     Clear the backend cache"
	@echo "  cache-warmup    Warm up the backend cache"
	@echo "  migration       Generate a new Doctrine migration file"
	@echo "  test-backend    Run backend PHPUnit tests"
	@echo "  frontend        Build frontend assets for production"
	@echo "  backend         Validate backend composer setup"
	@echo "  start-frontend-dev Show frontend dev server logs (starts automatically)"
	@echo "  generate-keys   Generate LexikJWTBundle RSA keys and Mercure HMAC secret"
	@echo "  deploy          Deploy application to production (no phpMyAdmin)"
	@echo "  deploy-build    Build production images"
	@echo "  deploy-up       Start production services"
	@echo "  deploy-init     Full production deployment: build, start, install deps, setup DB"

init: stop up install db cache ## Initialize the project: stop, build, start, install deps, setup DB, warm cache (frontend dev server starts automatically)
	@echo "Project initialization complete. Frontend dev server is starting..."

up: ## Build images (if needed) and start services in detached mode
	$(COMPOSE) build
	$(COMPOSE) up -d --build

down: stop ## Stop and remove containers, networks
	$(COMPOSE) down

stop: ## Stop running services
	$(COMPOSE) stop

restart: ## Stop and start services
	$(COMPOSE) restart

build: ## Build or rebuild service images
	$(COMPOSE) build

logs: ## Tail logs from all services
	$(COMPOSE) logs -f

logs-backend: ## Tail logs from the backend service
	$(COMPOSE) logs -f ${BACKEND_SERVICE}

logs-frontend: ## Tail logs from the frontend service
	$(COMPOSE) logs -f ${FRONTEND_SERVICE}

bash-backend: ## Connect to the backend container's shell as www-data
	$(COMPOSE) exec --user=${BACKEND_USER} ${BACKEND_SERVICE} /bin/bash

bash-frontend: ## Connect to the frontend container's shell as ${FRONTEND_USER}
	$(COMPOSE) exec --user=${FRONTEND_USER} ${FRONTEND_SERVICE} /bin/sh # Alpine uses sh, user is node

install: install-backend install-frontend ## Install backend (Composer) and frontend (yarn) dependencies

install-backend: ## Install backend Composer dependencies
	$(COMPOSE) exec --user=${BACKEND_USER} ${BACKEND_SERVICE} composer install --no-interaction --optimize-autoloader

install-frontend: ## Install frontend yarn dependencies
	$(COMPOSE) exec --user=${FRONTEND_USER} ${FRONTEND_SERVICE} yarn install

start-frontend-dev: ## Show frontend development server logs (dev server starts automatically)
	@echo "Showing frontend development server logs (dev server starts automatically with 'make up')..."
	$(COMPOSE) logs -f ${FRONTEND_SERVICE}

db: ## Run database migrations
	# Wait logic removed - handled by Docker Compose healthcheck now
	# Database is created by the MySQL container via MYSQL_DATABASE env var
	@echo "Running database migrations..."
	$(COMPOSE) exec ${BACKEND_SERVICE} bin/console doctrine:migration:migrate --no-interaction --allow-no-migration

cache-clear: ## Clear the backend Symfony cache
	$(COMPOSE) exec --user=${BACKEND_USER} ${BACKEND_SERVICE} bin/console cache:clear

cache-warmup: cache-clear ## Warm up the backend Symfony cache
	$(COMPOSE) exec --user=${BACKEND_USER} ${BACKEND_SERVICE} bin/console cache:warmup

cache: cache-warmup ## Alias for cache-warmup

migration: ## Generate a new Doctrine migration file
	$(COMPOSE) exec --user=${BACKEND_USER} ${BACKEND_SERVICE} bin/console make:migration

test-backend: ## Run backend PHPUnit tests
	$(COMPOSE) exec --user=${BACKEND_USER} ${BACKEND_SERVICE} php bin/phpunit # Assuming phpunit is installed via composer dev-deps

frontend: ## Build frontend assets for production
	@echo "Building frontend assets..."
	$(COMPOSE) exec ${FRONTEND_SERVICE} yarn build

backend: ## Validate backend composer setup
	@echo "Validating backend composer setup..."
	$(COMPOSE) exec --user=${BACKEND_USER} ${BACKEND_SERVICE} composer validate

delete: ## Delete all containers, networks, and volumes
	$(COMPOSE) down -v

generate-keys: ## Generate LexikJWTBundle RSA keys and Mercure HMAC secret, then restart services
	@echo "Generating LexikJWTBundle RSA keys..."
	$(COMPOSE) exec --user=${BACKEND_USER} ${BACKEND_SERVICE} bin/console lexik:jwt:generate-keypair --overwrite
	@echo "Generating Mercure HMAC secret..."
	@MERCURE_SECRET=$$(openssl rand -base64 32); \
	echo "Generated MERCURE_SECRET: $$MERCURE_SECRET"; \
	if grep -q "^MERCURE_SECRET=" .env 2>/dev/null; then \
		sed -i "s/^MERCURE_SECRET=.*/MERCURE_SECRET=$$MERCURE_SECRET/" .env; \
		echo "Updated MERCURE_SECRET in .env file"; \
	else \
		echo "" >> .env; \
		echo "MERCURE_SECRET=$$MERCURE_SECRET" >> .env; \
		echo "Added MERCURE_SECRET to .env file"; \
	fi
	@echo "Restarting services to apply new keys..."
	$(COMPOSE) restart
	@echo "Keys generation and service restart complete!"

# Production deployment targets
deploy: deploy-init ## Deploy application to production (alias for deploy-init)

deploy-build: ## Build production images
	@echo "Building production images..."
	@PUBLIC_IP=$$(curl -s ifconfig.me || curl -s ipecho.net/plain || echo "localhost"); \
	PUBLIC_IP=$$PUBLIC_IP $(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

deploy-up: ## Start production services
	@echo "Starting production services..."
	@PUBLIC_IP=$$(curl -s ifconfig.me || curl -s ipecho.net/plain || echo "localhost"); \
	export PUBLIC_IP=$$PUBLIC_IP; \
	echo "Starting services with PUBLIC_IP=$$PUBLIC_IP"; \
	PUBLIC_IP=$$PUBLIC_IP $(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml up -d

deploy-init: deploy-setup deploy-build deploy-up deploy-install deploy-db deploy-cache ## Full production deployment
	@echo "Production deployment completed! 🎉"
	@echo ""
	@PUBLIC_IP=$$(curl -s ifconfig.me || curl -s ipecho.net/plain || echo "localhost"); \
	echo "🌐 Application URLs:"; \
	echo "   - Main Application: https://$$PUBLIC_IP"; \
	echo "   - API Endpoint: https://$$PUBLIC_IP/api"; \
	echo "   - Mercure Hub: https://$$PUBLIC_IP/.well-known/mercure"
	@echo ""
	@echo "📋 Next Steps:"
	@echo "   1. Update Google Maps API key in frontend/.env: VITE_GOOGLE_MAPS_API_KEY=your_key"
	@echo "   2. Configure SSL certificates (Let's Encrypt recommended)"
	@echo "   3. Set up automated backups"
	@echo ""
	@echo "🔧 Environment Files Configured:"
	@echo "   - Root .env: Docker Compose variables"
	@echo "   - frontend/.env: Vite/React variables (VITE_*)"
	@echo "   - backend/.env: Symfony variables (APP_ENV=prod, CORS, etc.)"
	@echo ""
	@echo "🔒 SSL Certificates:"
	@echo "   - Generated automatically by nginx container using entrypoint.sh"
	@echo "   - Certificate CN set to detected public IP"

deploy-setup: ## Setup production environment and SSL certificates
	@echo "Setting up production environment..."
	@PUBLIC_IP=$$(curl -s ifconfig.me || curl -s ipecho.net/plain || echo "localhost"); \
	echo "Detected public IP: $$PUBLIC_IP"; \
	echo "Configuring environment files for IP: $$PUBLIC_IP"
	@echo "1. Configuring root .env (Docker Compose)..."
	@PUBLIC_IP=$$(curl -s ifconfig.me || curl -s ipecho.net/plain || echo "localhost"); \
	if [ ! -f ".env" ]; then \
		echo "Creating root .env file..."; \
		cp .env.example .env; \
	fi; \
	if grep -q "MERCURE_PUBLIC_URL=" .env; then \
		sed -i "s|^MERCURE_PUBLIC_URL=.*|MERCURE_PUBLIC_URL=https://$$PUBLIC_IP/.well-known/mercure|" .env; \
	else \
		echo "MERCURE_PUBLIC_URL=https://$$PUBLIC_IP/.well-known/mercure" >> .env; \
	fi; \
	if grep -q "CORS_ALLOW_ORIGIN=" .env; then \
		sed -i "s|^CORS_ALLOW_ORIGIN=.*|CORS_ALLOW_ORIGIN=^https?://($$PUBLIC_IP\|localhost\|127\\\.0\\\.0\\\.1)(:[0-9]+)?\$$|" .env; \
	else \
		echo "CORS_ALLOW_ORIGIN=^https?://($$PUBLIC_IP|localhost|127\.0\.0\.1)(:[0-9]+)?\$$" >> .env; \
	fi
	@echo "2. Configuring frontend/.env (Vite variables)..."
	@PUBLIC_IP=$$(curl -s ifconfig.me || curl -s ipecho.net/plain || echo "localhost"); \
	if grep -q "VITE_URL_API=" frontend/.env; then \
		sed -i "s|^VITE_URL_API=.*|VITE_URL_API=https://$$PUBLIC_IP/api|" frontend/.env; \
	else \
		echo "VITE_URL_API=https://$$PUBLIC_IP/api" >> frontend/.env; \
	fi; \
	echo "Frontend configured to use API at: https://$$PUBLIC_IP/api"
	@echo "3. Configuring backend/.env (Symfony variables)..."
	@PUBLIC_IP=$$(curl -s ifconfig.me || curl -s ipecho.net/plain || echo "localhost"); \
	sed -i "s|^APP_ENV=.*|APP_ENV=prod|" backend/.env; \
	sed -i "s|^MERCURE_PUBLIC_URL=.*|MERCURE_PUBLIC_URL=\"https://$$PUBLIC_IP/.well-known/mercure\"|" backend/.env; \
	sed -i "s|^CORS_ALLOW_ORIGIN=.*|CORS_ALLOW_ORIGIN='^https?://($$PUBLIC_IP\|localhost\|127\\\.0\\\.0\\\.1)(:[0-9]+)?\$$'|" backend/.env; \
	echo "Backend configured for production with IP: $$PUBLIC_IP"
	@echo "Preparing SSL certificate configuration..."
	@mkdir -p docker/nginx/certs
	@echo "SSL certificates will be generated automatically by nginx entrypoint.sh"

deploy-install: ## Install production dependencies
	@echo "Installing production dependencies..."
	$(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml exec -T ${BACKEND_SERVICE} composer install --no-dev --optimize-autoloader --no-interaction
	@echo "Generating JWT keys..."
	$(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml exec -T ${BACKEND_SERVICE} bin/console lexik:jwt:generate-keypair --skip-if-exists

deploy-db: ## Setup production database
	@echo "Setting up production database..."
	@echo "Waiting for database to be ready..."
	@sleep 15
	$(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml exec -T ${BACKEND_SERVICE} bin/console doctrine:migration:migrate --no-interaction --allow-no-migration

deploy-cache: ## Clear and warm production cache
	@echo "Setting up production cache..."
	$(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml exec -T ${BACKEND_SERVICE} bin/console cache:clear --env=prod
	$(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml exec -T ${BACKEND_SERVICE} bin/console cache:warmup --env=prod
	@echo "Setting proper permissions..."
	$(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml exec -T ${BACKEND_SERVICE} chown -R www-data:www-data /var/www/backend/var
	$(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml exec -T ${BACKEND_SERVICE} chmod -R 775 /var/www/backend/var

fix-linux-permissions: ## Ensures necessary backend directories are writable on Linux hosts (used by 'init')
	@if [ "$(shell uname)" = "Linux" ]; then \
		echo "Linux detected. Ensuring host directory permissions for Docker bind mounts..."; \
		echo "This may require sudo privileges to adjust permissions on your host."; \
		DIRECTORIES_TO_FIX="backend/var/cache backend/var/log backend/public/uploads backend/vendor"; \
		for dir_to_fix in $$DIRECTORIES_TO_FIX; do \
			echo "Attempting to ensure $$dir_to_fix exists and is writable on host..."; \
			sudo mkdir -p $$dir_to_fix; \
			sudo chmod -R 777 $$dir_to_fix; \
			echo "Set permissions for $$dir_to_fix on host."; \
		done; \
		echo "Host directory permissions adjustment step complete for Linux."; \
	else \
		echo "Not on Linux, skipping host permission adjustments."; \
	fi
