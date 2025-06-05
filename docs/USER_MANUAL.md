# BeruFoods User Manual

This manual provides comprehensive instructions for using the BeruFoods platform, covering customer, restaurant owner, and administrator functionalities.

## Getting Started with Demo Data

BeruFoods comes with demo data that can be quickly generated for testing and demonstration purposes. The demo data includes:

- **1 Administrator Account**: `admin@berufoods.com` with full system access
- **20 Customer Accounts**: `user1@example.com` through `user20@example.com` (10 in Granada, 10 in Madrid)
- **20 Restaurant Accounts**: `restaurant1@example.com` through `restaurant20@example.com` (10 in Granada, 10 in Madrid)
- **100 Menu Items**: 5 items per restaurant with realistic pricing and allergen information

All demo accounts use the password: `password123`

**Note**: The demo data command can be run multiple times safely - it will skip existing accounts and only create new ones. All addresses are realistic and match actual coordinates for locations in Granada and Madrid.

## Table of Contents

- [BeruFoods User Manual](#berufoods-user-manual)
  - [Getting Started with Demo Data](#getting-started-with-demo-data)
  - [Table of Contents](#table-of-contents)
  - [Customer Guide](#customer-guide)
    - [Creating an Account](#creating-an-account)
    - [Browsing Restaurants](#browsing-restaurants)
    - [Placing Orders](#placing-orders)
    - [Managing Your Profile](#managing-your-profile)
    - [Viewing Order History](#viewing-order-history)
  - [Restaurant Owner Guide](#restaurant-owner-guide)
    - [Restaurant Registration](#restaurant-registration)
    - [Managing Your Restaurant Profile](#managing-your-restaurant-profile)
    - [Managing Menu Items](#managing-menu-items)
    - [Processing Orders](#processing-orders)
    - [Viewing Order History (Restaurant)](#viewing-order-history-restaurant)
  - [Notifications System](#notifications-system)
  - [Troubleshooting](#troubleshooting)
  - [Administrator Guide](#administrator-guide)
    - [Admin Access](#admin-access)
    - [Admin Features](#admin-features)
    - [Admin Dashboard](#admin-dashboard)
    - [Using Admin Management Tools](#using-admin-management-tools)

## Customer Guide

### Creating an Account

1. **Sign Up**:
   - Navigate to the BeruFoods homepage
   - Click "Register" in the top-right corner
   - Fill in your details:
     - Email address
     - Password (minimum 6 characters)
     - Name (optional)
     - Phone number (optional)
     - Address (using the Google Maps integration)
   - Click "Sign Up"
   - You'll be automatically redirected to the login modal
   - Enter your credentials to log in

2. **Login**:
   - Click "Sign in" in the top-right corner
   - Enter your email and password
   - Click "Sign In"

### Browsing Restaurants

1. **Home Page**:
   - The home page displays a list of restaurants
   - Your location is automatically detected or you can search for a specific location

2. **Filtering Restaurants**:
   - Use the search bar to find restaurants by name
   - Filter by cuisine type using the cuisine buttons
   - Toggle "Open now" to see only currently open restaurants
   - Adjust the distance radius to find restaurants within a specific range

3. **Viewing a Restaurant**:
   - Click on a restaurant card to view its details and menu
   - The restaurant page shows:
     - Restaurant information (name, address, opening hours)
     - Menu items with descriptions, prices, and allergen information

### Placing Orders

1. **Adding Items to Cart**:
   - Browse a restaurant's menu
   - Click "Add to Cart" for items you want to order
   - Note: You can only order from one restaurant at a time

2. **Viewing Your Cart**:
   - Click the cart icon in the top-right corner
   - Review your selected items, quantities, and total price
   - Adjust quantities or remove items as needed

3. **Checkout Process**:
   - Click "Proceed to Checkout" to place your order
   - Review your order summary
   - Confirm your order
   - You'll receive a confirmation and be redirected to the order details page

4. **Tracking Your Order**:
   - After placing an order, you can track its status on the order details page
   - Status updates (preparing, ready, completed) will appear in real-time
   - You'll receive notifications when your order status changes

### Managing Your Profile

1. **Accessing Your Profile**:
   - Click on your user icon in the top-right corner
   - Select "Profile" from the dropdown menu

2. **Updating Profile Information**:
   - Edit your name, phone number, or address
   - Click "Update Profile" to save changes

3. **Changing Your Password**:
   - Click "Change Password" in your profile
   - Enter your new password and confirm it
   - Click "Update Profile" to save changes
   - You'll be logged out and need to log in again with your new password

### Viewing Order History

1. **Accessing Order History**:
   - Click on your user icon in the top-right corner
   - Select "Order History" from the dropdown menu

2. **Order Details**:
   - View a list of all your past orders
   - Click on an order to see its details:
     - Order ID and date
     - Restaurant information
     - Items ordered with quantities and prices
     - Order status
     - Total price

3. **Downloading Receipts**:
   - On the order details page, click "Download Receipt"
   - A PDF receipt will be generated and downloaded to your device

## Restaurant Owner Guide

### Restaurant Registration

1. **Sign Up as a Restaurant**:
   - Navigate to the BeruFoods homepage
   - Click "Enter as a restaurant" in the menu
   - Click "Register Restaurant"
   - Fill in your restaurant details:
     - Restaurant name
     - Business email
     - Password (minimum 6 characters)
     - Phone number
     - Opening and closing times
     - Restaurant address (using the Google Maps integration)
     - Food types/cuisines offered
     - Restaurant image (optional)
   - Click "Sign Up Restaurant"
   - You'll be redirected to the restaurant login page

2. **Login as a Restaurant**:
   - Enter your business email and password
   - Click "Login"
   - You'll be redirected to the restaurant dashboard

### Managing Your Restaurant Profile

1. **Accessing Your Profile**:
   - Click on your restaurant icon in the top-right corner
   - Select "Profile" from the dropdown menu

2. **Updating Profile Information**:
   - Edit your restaurant name, phone number, opening/closing times, or address
   - Update your food types/cuisines
   - Upload a new restaurant image
   - Click "Update Profile" to save changes

3. **Changing Your Password**:
   - Click "Change Password" in your profile
   - Enter your new password and confirm it
   - Click "Update Profile" to save changes
   - You'll be logged out and need to log in again with your new password

### Managing Menu Items

1. **Accessing Menu Management**:
   - From the dashboard, click "Manage Menu" or navigate to the "Articles" section

2. **Adding Menu Items**:
   - Click "Add New Article"
   - Fill in the item details:
     - Name
     - Description
     - Price
     - Image (optional)
     - Allergens (optional)
     - Availability status
   - Click "Create Article"

3. **Editing Menu Items**:
   - On the menu management page, find the item you want to edit
   - Click "Edit"
   - Update the item details
   - Click "Save Changes"

4. **Deleting Menu Items**:
   - On the menu management page, find the item you want to delete
   - Click "Delete"
   - Confirm the deletion

5. **Managing Item Availability**:
   - Toggle the availability switch on any menu item to quickly mark it as available or unavailable
   - Available items can be ordered by customers
   - Unavailable items remain on your menu but cannot be ordered

6. **Bulk Import via CSV**:
   - Click "Import from CSV" on the menu management page
   - Download the template if needed
   - Prepare your CSV file with menu items
   - Upload the file and confirm the import

### Processing Orders

1. **Viewing New Orders**:
   - New orders appear on your dashboard
   - You'll receive real-time notifications when new orders arrive

2. **Updating Order Status**:
   - From the dashboard or orders page, click on an order to view details
   - Use the status buttons to update the order status:
     - "Mark as Preparing" (from Pending)
     - "Mark as Ready" (from Preparing)
     - "Mark as Completed" (from Ready)
     - "Mark as Cancelled" (from any status)
   - Customers will receive notifications when you update the status

3. **Viewing Order Details**:
   - Click on any order to see its complete details:
     - Customer information
     - Order items with quantities and prices
     - Order status and history
     - Total price

4. **Generating Order Bills**:
   - On the order details page, click "Download Bill"
   - A PDF bill will be generated and downloaded to your device

### Viewing Order History (Restaurant)

1. **Accessing Order History**:
   - Click "Order History" in the main navigation
   - Or select "View All Orders" from the dashboard

2. **Filtering Orders**:
   - Filter by status (Pending, Preparing, Ready, Completed, Cancelled)
   - Filter by date (Today, Yesterday, Last 7 Days, Last 30 Days, All Time)

3. **Order Analytics**:
   - View order counts by status at the top of the orders page
   - Track completed vs. cancelled orders
   - Monitor pending and in-progress orders

## Notifications System

Both customers and restaurant owners receive real-time notifications:

1. **Types of Notifications**:
   - New order notifications (for restaurants)
   - Order status updates (for customers)
   - System notifications

2. **Viewing Notifications**:
   - Click the bell icon in the top-right corner
   - View unread notifications
   - Click "View All" to see all notifications
   - Click "Mark All Read" to mark all notifications as read

3. **Notification Preferences**:
   - Real-time notifications appear as they happen
   - Notifications are stored and can be viewed later
   - Unread notifications are highlighted

## Troubleshooting

If you encounter any issues while using the BeruFoods platform:

1. **Login Issues**:
   - Ensure you're using the correct email and password
   - Check if you're using the appropriate login form (customer vs. restaurant)
   - Try resetting your password if you've forgotten it

2. **Order Placement Issues**:
   - Ensure you're logged in as a customer
   - Check that all items in your cart are available
   - Verify that the restaurant is currently open

3. **Menu Management Issues**:
   - Ensure image files are in supported formats (JPG, PNG, WebP)
   - Check that prices are entered as numbers
   - Verify that required fields are completed

4. **Contact Support**:
   - For persistent issues, contact support at support@berufoods.com

## Administrator Guide

### Admin Access

The BeruFoods platform includes an administrator account for system management:

- **Email**: `admin@berufoods.com`
- **Password**: `password123` (demo environment)

### Admin Features

Administrators have access to a comprehensive admin dashboard and management tools:

1. **Admin Dashboard**:
   - Centralized overview of the platform
   - Quick access to user and restaurant management
   - Real-time statistics showing total users and restaurants
   - Visual navigation cards for easy access to admin functions

2. **User Management**:
   - View all registered users with pagination
   - Edit user email and roles
   - Ban users

3. **Restaurant Management**:
   - View all registered restaurants with pagination
   - Edit restaurant information (name, address, phone, SIRET)
   - View restaurant orders and articles in detail
   - Edit individual orders (status) and articles (name, price, description)
   - Ban restaurants
   - Delete restaurant articles

4. **Role Management**:
   - Edit user roles (comma-separated format in the user management interface)
   - Support for ROLE_USER, ROLE_RESTAURANT, ROLE_ADMIN
   - Role changes restricted to admin users only


### Admin Dashboard

The admin dashboard provides a centralized interface for platform management:

1. **Accessing the Dashboard**:
   - Log in with admin credentials (`admin@berufoods.com`)
   - You'll be automatically redirected to the admin dashboard
   - Or navigate to your profile menu and select "Admin Dashboard"

2. **Dashboard Features**:
   - **Management Cards**: Visual navigation to User Management and Restaurant Management
   - **Quick Statistics**: Real-time counters showing total users and restaurants
   - **Responsive Design**: Optimized for both desktop and mobile access

3. **Navigation**:
   - **User Management Card**: Click to access the comprehensive user management interface
   - **Restaurant Management Card**: Click to manage restaurants, menus, and operations
   - **Header Menu**: Access dashboard, user management, and restaurant management from any page

4. **Quick Stats Display**:
   - Total registered users count
   - Total active restaurants count
   - Loading indicators during data fetching
   - Formatted numbers for better readability

### Using Admin Management Tools

1. **User Management Interface**:
   - Access via the dashboard or header menu
   - View paginated list of all users (ID, email, roles)
   - Edit user email and roles through modal forms
   - Ban users (soft delete with confirmation)

2. **Restaurant Management Interface**:
   - Access via the dashboard or header menu
   - View paginated list of restaurants (ID, name, address)
   - Edit restaurant details through modal forms
   - Expand restaurant details to view orders and articles
   - Edit individual orders and articles through modal forms
   - Ban restaurants and delete articles with confirmation

For detailed administrator instructions and system maintenance, please refer to the [Administration Manual](./ADMIN_MANUAL.md).