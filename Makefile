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
.PHONY: help init up down restart build logs-backend logs-frontend bash-backend bash-frontend install db cache cache-clear migration test-backend frontend backend fix-linux-permissions start-frontend-dev-blocking generate-keys demo-data

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
	@echo "  demo-data       Generate demo data: 20 users, 20 restaurants, 5 products per restaurant"

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

demo-data: ## Generate demo data: 20 users, 20 restaurants, 5 products per restaurant
	@echo "Generating demo data..."
	$(COMPOSE) exec ${BACKEND_SERVICE} bin/console app:create-demo-data
	@echo "Demo data generation complete!"

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