import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { fetchDataFromEndpoint } from '../services/useApiService';
import { toast } from 'sonner';
import { API_ENDPOINTS, NOTIFICATION_TYPES } from '../utils/constants';

const NotificationContext = createContext();
const MERCURE_PUBLIC_URL = import.meta.env.VITE_MERCURE_PUBLIC_URL;

export const NotificationProvider = ({ children }) => {
  const { entity, isAuthenticated, token: apiToken } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [eventSource, setEventSource] = useState(null);
  const [mercureToken, setMercureToken] = useState(null);
  const [error, setError] = useState(null);
  
  const [persistentNotifications, setPersistentNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async (page = 1, readStatus = null) => {
    if (!isAuthenticated() || !entity) return;
    
    setLoading(true);
    try {
      const url = API_ENDPOINTS.NOTIFICATIONS.LIST(page, 15, readStatus);
      
      const result = await fetchDataFromEndpoint(url, 'GET', null, true);
      setPersistentNotifications(result.items || []);
      setPagination(result.pagination || { page: 1, limit: 15, total: 0, pages: 0 });
    } catch (err) {
      setError(err.message || "Error fetching notifications");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, entity]);
  
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated() || !entity) return;
    
    try {
      const result = await fetchDataFromEndpoint(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT, 'GET', null, true);
      setUnreadCount(result.count || 0);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }, [isAuthenticated, entity]);

  const handleRealTimeNotification = useCallback(async (data) => {
    await Promise.all([
      fetchUnreadCount(),
      fetchNotifications(1, false)
    ]);

    let message = "Notification received.";
    if (data.message) {
      message = data.message;
    } else if (data.type === NOTIFICATION_TYPES.NEW_ORDER && data.orderId) {
      message = `New order #${data.orderId} received!`;
    } else if (data.type === NOTIFICATION_TYPES.STATUS_UPDATE && data.orderId && data.status) {
      message = `Order #${data.orderId} status changed to: ${data.status}`;
    } else if (data.orderId) {
      message = `Update for order #${data.orderId}.`;
    }

    switch (data.type) {
      case NOTIFICATION_TYPES.NEW_ORDER:
        toast.success(message, {
          description: 'Check your notifications for details',
          duration: 5000,
        });
        break;
      case NOTIFICATION_TYPES.STATUS_UPDATE:
        toast.info(message, {
          description: 'Order status has been updated',
          duration: 4000,
        });
        break;
      case NOTIFICATION_TYPES.ORDER_UPDATE:
        toast.info(message, {
          description: 'Order information updated',
          duration: 4000,
        });
        break;
      default:
        toast(message, {
          description: 'New notification received',
          duration: 4000,
        });
    }
  }, [fetchUnreadCount, fetchNotifications]);

  useEffect(() => {
    const fetchMercureToken = async () => {
      if (isAuthenticated() && entity && !mercureToken && apiToken) {
        try {
          setError(null);
          const tokenData = await fetchDataFromEndpoint(API_ENDPOINTS.AUTH.MERCURE_TOKEN, 'GET', null, true);
          if (tokenData && tokenData.mercureToken) {
            setMercureToken(tokenData.mercureToken);
          } else {
            setError("Failed to fetch Mercure token.");
          }
        } catch (err) {
          setError(err.message || "Error fetching Mercure token.");
        }
      }
    };

    fetchMercureToken();
  }, [isAuthenticated, entity, apiToken, mercureToken]);

  useEffect(() => {
    if (!isAuthenticated() || !entity || !mercureToken) {
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
      }
      return;
    }

    let topics = [];
    if (entity.roles?.includes('ROLE_RESTAURANT') && entity.restaurantId) {
      topics.push(API_ENDPOINTS.MERCURE_TOPICS.RESTAURANT_ORDERS(entity.restaurantId));
    } else if (entity.roles?.includes('ROLE_USER') && entity.userId) {
      topics.push(API_ENDPOINTS.MERCURE_TOPICS.USER_ORDERS(entity.userId));
    }

    if (topics.length === 0) {
      return;
    }

    const url = new URL(MERCURE_PUBLIC_URL);
    topics.forEach(topic => url.searchParams.append('topic', topic));

    const isProduction = !MERCURE_PUBLIC_URL.includes('localhost');
    
    let es;
    if (isProduction) {
      url.searchParams.append('authorization', mercureToken);
      es = new EventSource(url);
    } else {
      document.cookie = `mercureAuthorization=${mercureToken}; path=/; secure; samesite=none`;
      es = new EventSource(url, { withCredentials: true });
    }

    es.onopen = () => {
      setError(null);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleRealTimeNotification(data);
              } catch {
          fetchUnreadCount();
          toast.error('Failed to process notification', {
            description: 'Received an invalid notification format',
            duration: 3000,
          });
        }
    };

    es.onerror = (error) => {
      if (error.target && error.target.readyState === EventSource.CLOSED) {
        setError('Mercure connection closed. Attempting to reconnect or token might be expired.');
      } else {
        setError('Mercure connection error.');
      }
    };

    setEventSource(es);

    return () => {
      if (es) {
        es.close();
        setEventSource(null);
      }
    };
  }, [entity, isAuthenticated, mercureToken, handleRealTimeNotification, apiToken, fetchUnreadCount]);
  
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await fetchDataFromEndpoint(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId), 'PUT', null, true);
      
      setPersistentNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      
      fetchUnreadCount();
      
      return true;
    } catch {
      return false;
    }
  }, [fetchUnreadCount]);
  
  const markAllAsRead = useCallback(async () => {
    try {
      await fetchDataFromEndpoint(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, 'PUT', null, true);
      
      setPersistentNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      
      setUnreadCount(0);
      
      return true;
    } catch {
      return false;
    }
  }, []);
  
  useEffect(() => {
    if (isAuthenticated() && entity) {
      fetchNotifications(1, false);
      fetchUnreadCount();
    }
  }, [isAuthenticated, entity, fetchNotifications, fetchUnreadCount]);
  
  const addNotification = useCallback((data) => {
    handleRealTimeNotification(data);
  }, [handleRealTimeNotification]);

  const clearNotification = (idToClear) => {
    setNotifications(prev => prev.filter(n => n.id !== idToClear));
  };
  
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const value = {
    notifications,
    addNotification,
    clearNotification,
    clearAllNotifications,
    persistentNotifications,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    unreadCount,
    pagination,
    loading,
    
    mercureError: error
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};