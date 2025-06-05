// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN_USER: '/login',
    LOGIN_RESTAURANT: '/restaurant/login',
    REGISTER_USER: '/auth/register/user',
    REGISTER_RESTAURANT: '/auth/register/restaurant',
    MERCURE_TOKEN: '/auth/mercure_token',
  },
  
  // Articles
  ARTICLES: {
    BASE: '/articles',
    RESTAURANT_OWNER: '/articles/restaurant-owner',
    BY_RESTAURANT: (restaurantId) => `/articles?restaurantId=${restaurantId}`,
    BY_ID: (articleId) => `/articles/${articleId}`,
  },
  
  // Orders
  ORDERS: {
    BASE: '/orders',
    BY_ID: (orderId) => `/orders/${orderId}`,
    USER_ORDERS: (page, limit) => `/orders?page=${page}&limit=${limit}`,
    RESTAURANT_ORDERS: (queryParams) => `/orders?${queryParams}`,
  },
  
  // Notifications
  NOTIFICATIONS: {
    BASE: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: (notificationId) => `/notifications/${notificationId}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    LIST: (page, limit, readStatus) => {
      let url = `/notifications?page=${page}&limit=${limit}`;
      if (readStatus !== null) {
        url += `&read=${readStatus}`;
      }
      return url;
    },
  },
  
  // Food Types
  FOOD_TYPES: '/food-types',
  
  // Mercure Topics
  MERCURE_TOPICS: {
    RESTAURANT_ORDERS: (restaurantId) => `/orders/restaurant/${restaurantId}`,
    USER_ORDERS: (userId) => `/orders/user/${userId}`,
  },
};

// Frontend Route Paths (already exist in router/index.jsx but duplicated here for easier access)
export const ROUTES = {
  // Public Routes
  ROOT: '/',
  
  // Auth Routes
  REGISTER: '/register',
  
  // Restaurant Routes
  RESTAURANT: {
    ROOT: '/restaurant',
    LOGIN: '/restaurant/login',
    REGISTER: '/restaurant/register',
    DASHBOARD: '/restaurant/dashboard',
    PROFILE: '/restaurant/profile',
    ORDERS: '/restaurant/orders',
    ORDER_DETAILS: '/restaurant/orders/:orderId',
    ORDER_DETAILS_DYNAMIC: (orderId) => `/restaurant/orders/${orderId}`,
    ARTICLES: '/restaurant/articles',
    ARTICLES_NEW: '/restaurant/articles/new',
    ARTICLES_EDIT: '/restaurant/articles/:articleId/edit',
    ARTICLES_EDIT_DYNAMIC: (articleId) => `/restaurant/articles/${articleId}/edit`,
  },
  
  // User Routes
  USER: {
    PROFILE: '/user/profile',
    ORDERS: '/user/orders',
    ORDER_DETAILS: '/user/orders/:orderId',
    ORDER_DETAILS_DYNAMIC: (orderId) => `/user/orders/${orderId}`,
    CART: '/cart',
  },
  
  // Restaurant Menu (Public)
  RESTAURANT_MENU: {
    ARTICLES: '/restaurants/:restaurantId/articles',
    ARTICLES_DYNAMIC: (restaurantId) => `/restaurants/${restaurantId}/articles`,
  },

  // Admin Routes
  ADMIN: {
    DASHBOARD: '/admin',
    USERS: '/admin/users',
    RESTAURANTS: '/admin/restaurants',
  },
};

// Status Constants
export const ORDER_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

// Validation Constants
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  PHONE_PATTERN: /^[+]?[\d\s\-\(\)]+$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

// Pagination Constants
export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  ARTICLES_LIMIT: 12,
  ORDERS_LIMIT: 15,
  NOTIFICATIONS_LIMIT: 15,
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  AUTHENTICATED_ENTITY: 'authenticatedEntity',
  CART_ITEMS: 'cartItems',
  THEME: 'theme',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  NEW_ORDER: 'new_order',
  STATUS_UPDATE: 'status_update',
  ORDER_UPDATE: 'order_update',
}; 