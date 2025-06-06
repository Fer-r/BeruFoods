# BeruFoods - Food Delivery Platform

BeruFoods is a comprehensive food delivery platform that connects users with local restaurants. This application allows users to browse restaurants, view menus, place orders, and track deliveries, while providing restaurant owners with tools to manage their menus, orders, and business information.

## Quick Start Guide

### Credentials

**Default Demo Accounts** (All use password: `password123`):

**Administrator Account:**
- Email: `admin@berufoods.com`
- Password: `password123`
- Access: Full admin dashboard with user and restaurant management

**Customer Test Accounts:**
- Email: `user1@example.com` to `user20@example.com`
- Password: `password123`
- Locations: 10 users in Granada, 10 users in Madrid

**Restaurant Owner Test Accounts:**
- Email: `restaurant1@example.com` to `restaurant20@example.com`
- Password: `password123`
- Locations: 10 restaurants in Granada, 10 restaurants in Madrid

### Service Ports

**Production URLs (Nginx):**
- Frontend: [http://localhost](http://localhost) (Port 80)
- Backend API: [http://localhost/api](http://localhost/api) (Port 80)
- HTTPS: [https://localhost](https://localhost) (Port 443)

**Development URLs (Direct Services):**
- Frontend (Vite Dev Server): [http://localhost:5173](http://localhost:5173)
- Backend (PHP-FPM): Port 9000 (internal)
- Database (MySQL): [http://localhost:3306](http://localhost:3306)
- phpMyAdmin: [http://localhost:8081](http://localhost:8081)
- Mercure Hub: [http://localhost:3000](http://localhost:3000)

**Database Access:**
- Host: `localhost:3306`
- Database: `berufoods` (configurable via `.env`)
- User: `berufoods_user` (configurable via `.env`)
- Password: Set in `.env` file
- Root Password: Set in `.env` file

### Testing the Application

**Quick Setup:**
```bash
git clone <repository-url>
cd BeruFoods
cp .env.example .env
make init          # Initialize and start all services
make demo-data     # Create test data
```

**Access Points:**
1. **Customer Experience**: Visit [http://localhost](http://localhost) → Login as `user1@example.com`
2. **Restaurant Management**: Visit [http://localhost](http://localhost) → Click "Enter as restaurant" → Login as `restaurant1@example.com`
3. **Admin Dashboard**: Visit [http://localhost](http://localhost) → Login as `admin@berufoods.com` → Navigate to Admin Dashboard

## Table of Contents

- [BeruFoods - Food Delivery Platform](#berufoods---food-delivery-platform)
  - [Quick Start Guide](#quick-start-guide)
    - [Credentials](#credentials)
    - [Service Ports](#service-ports)
    - [Testing the Application](#testing-the-application)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
    - [Key Features](#key-features)
    - [Demo Data](#demo-data)
  - [Installation Guide](#installation-guide)
    - [Prerequisites](#prerequisites)
    - [Setup Instructions](#setup-instructions)
  - [Usage Instructions](#usage-instructions)
    - [Local Development](#local-development)
    - [Testing All Functionalities](#testing-all-functionalities)
    - [Google Maps API Setup](#google-maps-api-setup)
  - [User Manual](#user-manual)
  - [Administration Manual](#administration-manual)
  - [Technical Stack](#technical-stack)
    - [Frontend](#frontend)
    - [Backend](#backend)
    - [Infrastructure](#infrastructure)
  - [Project Structure](#project-structure)

## Getting Started

BeruFoods consists of two main components:

1. **Frontend**: A React application built with Vite, providing the user interface for both customers and restaurant owners.
2. **Backend**: A Symfony PHP API that handles data processing, authentication, and business logic.

The application is containerized using Docker for consistent development and deployment environments.

### Key Features

- **For Customers**:
  - Browse restaurants by location, cuisine type, and availability
  - View restaurant menus and item details
  - Place and track food orders
  - Manage user profile and order history

- **For Restaurant Owners**:
  - Manage restaurant profile and menu items
  - Process incoming orders
  - Track order history and analytics
  - Receive real-time notifications for new orders

- **For Administrators**:
  - Access admin dashboard with navigation and statistics
  - Manage user accounts (edit email, roles, ban users)
  - Manage restaurants (edit details, view orders/articles, ban restaurants)
  - View real-time platform statistics (total users and restaurants)

### Demo Data

You can quickly populate the system with demo data using:

```bash
make demo-data
```

This command can be run multiple times safely - it will skip existing accounts and only create new ones.

This will create:
- 1 admin user
- 20 demo users (10 in Granada, 10 in Madrid)
- 20 demo restaurants (10 in Granada, 10 in Madrid)
- 5 menu items for each restaurant

All demo accounts use the password: `password123`

Example accounts:
- **Administrator**:
  - Email: `admin@berufoods.com`
  - Password: `password123`
  - Access: Full admin dashboard with user and restaurant management

- **Customer**: 
  - Email: `user1@example.com` through `user20@example.com`
  - Password: `password123`

- **Restaurant Owner**:
  - Email: `restaurant1@example.com` through `restaurant20@example.com`
  - Password: `password123`

## Installation Guide

### Prerequisites

- [Docker](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Make](https://www.gnu.org/software/make/) (Optional, but recommended for using the `Makefile` commands)
- [Git](https://git-scm.com/downloads)

### Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd BeruFoods
   ```

2. **Create Environment Files**:
   Copy the example environment files and configure them:
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file to set your environment variables:
   ```
   # Database Configuration
   MYSQL_ROOT_PASSWORD=your_secure_root_password
   MYSQL_DATABASE=berufoods
   MYSQL_USER=berufoods_user
   MYSQL_PASSWORD=your_secure_user_password

   # JWT Configuration
   JWT_PASSPHRASE=your_secure_passphrase

   # Google Maps API (Frontend)
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

   # API Base URL (Frontend)
   VITE_URL_API=http://localhost/api
   
   # Mercure Configuration
   MERCURE_JWT_SECRET=your_secure_mercure_secret
   ```

3. **Initialize the Project**:
   Using Make (recommended):
   ```bash
   make init
   ```
   
   Or manually with Docker Compose:
   ```bash
   docker compose build
   docker compose up -d
   docker compose exec --user=www-data backend composer install
   docker compose exec --user=node frontend yarn install
   docker compose exec backend bin/console doctrine:migration:migrate --no-interaction
   ```

4. **Generate JWT Keys**:
   ```bash
   make generate-keys
   ```
   Or manually:
   ```bash
   docker compose exec --user=www-data backend bin/console lexik:jwt:generate-keypair --overwrite
   ```

5. **Access the Application**:
   - Frontend: [http://localhost](http://localhost)
   - Backend API: [http://localhost/api](http://localhost/api)
   - phpMyAdmin: [http://localhost:8081](http://localhost:8081)

6. **Generate Demo Data (Optional)**:
   ```bash
   make demo-data
   ```

## Usage Instructions

### Local Development

**Starting the Application:**
```bash
# Using Make (Recommended)
make init          # First time setup
make up           # Start services
make down         # Stop services
make restart      # Restart services
make logs         # View logs
make clean        # Clean up containers and volumes

# Manual Docker Commands
docker compose up -d          # Start all services
docker compose down           # Stop all services
docker compose logs -f        # Follow logs
docker compose exec backend bash  # Access backend container
```

**Development Workflow:**
```bash
# Install dependencies
make install-deps

# Generate JWT keys (required for authentication)
make generate-keys

# Database operations
make migrate                  # Run migrations
make migration-diff          # Generate new migration
make fixtures               # Load fixtures
make demo-data              # Generate demo data

# Cache operations
make cache-clear            # Clear Symfony cache
make cache-warmup          # Warm up cache
```

### Testing All Functionalities

**1. Customer Flow Testing:**
```bash
# After running `make init` and `make demo-data`
```
1. Visit [http://localhost](http://localhost)
2. Login as `user1@example.com` / `password123`
3. Browse restaurants (10 available in Granada, 10 in Madrid)
4. View restaurant menu items (5 items per restaurant)
5. Add items to cart and place an order
6. Check order history and download receipt
7. Update profile information

**2. Restaurant Owner Flow Testing:**
```bash
# Access restaurant interface
```
1. Visit [http://localhost](http://localhost)
2. Click "Enter as restaurant"
3. Login as `restaurant1@example.com` / `password123`
4. Manage restaurant profile and hours
5. Add/edit menu items with allergen information
6. Process incoming orders (status: preparing → ready → completed)
7. View order history and analytics
8. Test real-time notifications when new orders arrive

**3. Administrator Flow Testing:**
```bash
# Admin dashboard access
```
1. Visit [http://localhost](http://localhost)
2. Login as `admin@berufoods.com` / `password123`
3. Navigate to Admin Dashboard from user menu
4. Manage user accounts (edit, ban, change roles)
5. Manage restaurants (edit details, view orders/articles, ban)
6. View real-time statistics (total users and restaurants)
7. Test user and restaurant search functionality

**4. Real-time Features Testing:**
```bash
# Test notifications system
```
1. Open two browser windows
2. Login as restaurant owner in one, customer in another
3. Place an order as customer
4. Observe real-time notification in restaurant dashboard
5. Update order status and observe real-time updates


### Google Maps API Setup

This project uses Google Maps API for location services. To set it up:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create an API key and add restrictions as needed
5. Add the API key to your `.env` file as `VITE_GOOGLE_MAPS_API_KEY`

## User Manual

For detailed instructions on how to use the BeruFoods platform, please refer to the [User Manual](docs/USER_MANUAL.md).

## Administration Manual

For system administration and maintenance instructions, please refer to the [Administration Manual](docs/ADMIN_MANUAL.md).

## Technical Stack

### Frontend
- React 18.3+
- Vite 6.0+
- TailwindCSS 4.1+
- DaisyUI
- React Router
- JWT Authentication

### Backend
- Symfony 7.2+
- PHP 8.2+
- MySQL 8.0
- Doctrine ORM
- Lexik JWT Authentication
- Mercure for real-time updates

### Infrastructure
- Docker & Docker Compose
- Nginx
- PHP-FPM
- MySQL
- Mercure Hub

## Project Structure

```
BeruFoods/
├── backend/               # Symfony backend API
│   ├── config/            # Symfony configuration
│   ├── migrations/        # Database migrations
│   ├── public/            # Public web directory
│   ├── src/               # PHP source code
│   └── ...
├── frontend/              # React frontend application
│   ├── public/            # Static assets
│   ├── src/               # React source code
│   └── ...
├── docker/                # Docker configuration
│   ├── nginx/             # Nginx configuration
│   ├── php/               # PHP configuration
│   └── ...
├── docs/                  # Documentation
│   ├── USER_MANUAL.md     # User guide
│   ├── ADMIN_MANUAL.md    # Admin guide
│   └── REALTIME_UPDATES.md # Real-time features
├── docker-compose.yml     # Docker Compose configuration
├── Makefile               # Make commands for common operations
├── .env.example           # Environment variables template
└── README.md              # Project documentation
```