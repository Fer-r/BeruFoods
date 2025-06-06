# BeruFoods - Food Delivery Platform

BeruFoods is a comprehensive food delivery platform that connects users with local restaurants. This application allows users to browse restaurants, view menus, place orders, and track deliveries, while providing restaurant owners with tools to manage their menus, orders, and business information.

## Table of Contents

- [BeruFoods - Food Delivery Platform](#berufoods---food-delivery-platform)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
    - [Key Features](#key-features)
    - [Demo Data](#demo-data)
  - [Installation Guide](#installation-guide)
    - [Prerequisites](#prerequisites)
    - [Setup Instructions](#setup-instructions)
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
├── docker-compose.yml     # Docker Compose configuration
├── Makefile               # Make commands for common operations
└── README.md              # Project documentation
```