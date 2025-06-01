import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { fetchDataFromEndpoint } from '../services/useApiService'; // Kilo Code: Import useApiService
import { toast } from 'sonner';

const NotificationContext = createContext();
const MERCURE_PUBLIC_URL = 'https://localhost/.well-known/mercure'; // Kilo Code: Use configured public URL

export const NotificationProvider = ({ children }) => {
  const { entity, isAuthenticated, token: apiToken } = useAuth(); // Kilo Code: Get apiToken for Mercure token fetch
  
  // Real-time notification states (kept for backward compatibility, but not used for toasts)
  const [notifications, setNotifications] = useState([]);
  const [eventSource, setEventSource] = useState(null);
  const [mercureToken, setMercureToken] = useState(null); // Kilo Code: State for Mercure token
  const [error, setError] = useState(null); // Kilo Code: State for errors
  
  // Persistent notification states
  const [persistentNotifications, setPersistentNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);

  // Fetch persisted notifications from API
  const fetchNotifications = useCallback(async (page = 1, readStatus = null) => {
    if (!isAuthenticated() || !entity) return;
    
    setLoading(true);
    try {
      let url = `/notifications?page=${page}&limit=15`;
      if (readStatus !== null) {
        url += `&read=${readStatus}`;
      }
      
      const result = await fetchDataFromEndpoint(url, 'GET', null, true);
      setPersistentNotifications(result.items || []);
      setPagination(result.pagination || { page: 1, limit: 15, total: 0, pages: 0 });
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err.message || "Error fetching notifications");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, entity]);
  
  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated() || !entity) return;
    
    try {
      const result = await fetchDataFromEndpoint('/notifications/unread-count', 'GET', null, true);
      setUnreadCount(result.count || 0);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }, [isAuthenticated, entity]);

  // Function to handle real-time notifications by refreshing bell data and showing toast
  const handleRealTimeNotification = useCallback(async (data) => {
    console.log("Processing real-time notification:", data);
    
    // Immediately refresh the notification bell data
    await Promise.all([
      fetchUnreadCount(),
      fetchNotifications(1, false) // Fetch unread notifications for the dropdown
    ]);

    // Create user-friendly message
    let message = "Notification received.";
    if (data.message) {
      message = data.message;
    } else if (data.type === 'new_order' && data.orderId) {
      message = `New order #${data.orderId} received!`;
    } else if (data.type === 'status_update' && data.orderId && data.status) {
      message = `Order #${data.orderId} status changed to: ${data.status}`;
    } else if (data.orderId) {
      message = `Update for order #${data.orderId}.`;
    }

    // Show Sonner toast notification based on type
    switch (data.type) {
      case 'new_order':
        toast.success(message, {
          description: 'Check your notifications for details',
          duration: 5000,
        });
        break;
      case 'status_update':
        toast.info(message, {
          description: 'Order status has been updated',
          duration: 4000,
        });
        break;
      case 'order_update':
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
    // Kilo Code: Fetch Mercure token first
    const fetchMercureToken = async () => {
      if (isAuthenticated() && entity && !mercureToken && apiToken) {
        try {
          setError(null);
          const tokenData = await fetchDataFromEndpoint('/auth/mercure_token', 'GET', null, true);
          if (tokenData && tokenData.mercureToken) {
            setMercureToken(tokenData.mercureToken);
          } else {
            console.error("Failed to fetch Mercure token or token not in response");
            setError("Failed to fetch Mercure token.");
          }
        } catch (err) {
          console.error("Error fetching Mercure token:", err);
          setError(err.message || "Error fetching Mercure token.");
        }
      }
    };

    fetchMercureToken();
  }, [isAuthenticated, entity, apiToken, mercureToken]);

  useEffect(() => {
    if (!isAuthenticated() || !entity || !mercureToken) { // Kilo Code: Depend on mercureToken
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
        console.log("Mercure EventSource closed due to logout, missing entity, or missing token.");
      }
      return;
    }

    // Kilo Code: Determine topics to subscribe to based on user type
    let topics = [];
    if (entity.roles?.includes('ROLE_RESTAURANT') && entity.restaurantId) {
      topics.push(`/orders/restaurant/${entity.restaurantId}`);
    } else if (entity.roles?.includes('ROLE_USER') && entity.userId) {
      topics.push(`/orders/user/${entity.userId}`);
    }

    if (topics.length === 0) {
      console.log("No relevant Mercure topics to subscribe to for the current entity:", entity);
      return;
    }

    // Kilo Code: Create URL with topics
    const url = new URL(MERCURE_PUBLIC_URL);
    topics.forEach(topic => url.searchParams.append('topic', topic));
    
    console.log("Subscribing to Mercure URL:", url.toString());
    
    // Set the cookie with the JWT token for Mercure authorization
    // The cookie name must be 'mercureAuthorization' for the Mercure hub to recognize it
    document.cookie = `mercureAuthorization=${mercureToken}; path=/.well-known/mercure; secure; samesite=strict`;
    
    // Create standard EventSource - no need for headers as we're using cookies
    const es = new EventSource(url);

    es.onopen = () => {
      console.log("Mercure EventSource connection established.");
      setError(null); // Clear previous errors on successful connection
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Mercure message received:", data);
        handleRealTimeNotification(data); // Updated to use new handler
      } catch (e) {
        console.error("Failed to parse Mercure message data:", event.data, e);
        // Still refresh bell data even on parse error
        fetchUnreadCount();
        // Show error toast
        toast.error('Failed to process notification', {
          description: 'Received an invalid notification format',
          duration: 3000,
        });
      }
    };

    es.onerror = (error) => {
      console.error('Mercure EventSource failed:', error);
      // More specific error handling based on event type if possible
      if (error.target && error.target.readyState === EventSource.CLOSED) {
        setError('Mercure connection closed. Attempting to reconnect or token might be expired.');
        // Potentially trigger re-fetch of Mercure token if it's an auth issue
        // For now, rely on logout/login or app reload to refresh token
      } else {
        setError('Mercure connection error.');
      }
      // To prevent spamming, don't close and nullify eventSource here immediately.
      // EventSource has its own reconnection logic.
      // Closing it here might interfere with that.
      // If errors persist, it might indicate a deeper issue (e.g. expired Mercure token).
    };

    setEventSource(es);

    return () => {
      if (es) {
        es.close();
        setEventSource(null);
        console.log("Mercure EventSource closed on component unmount or dependency change.");
      }
    };
    // Kilo Code: Add mercureToken and handleRealTimeNotification to dependency array
  }, [entity, isAuthenticated, mercureToken, handleRealTimeNotification, apiToken, fetchUnreadCount]);
  
  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await fetchDataFromEndpoint(`/notifications/${notificationId}/read`, 'PUT', null, true);
      
      // Update local state
      setPersistentNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      
      // Refresh unread count
      fetchUnreadCount();
      
      return true;
    } catch (err) {
      console.error("Error marking notification as read:", err);
      return false;
    }
  }, [fetchUnreadCount]);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await fetchDataFromEndpoint('/notifications/read-all', 'PUT', null, true);
      
      // Update local state
      setPersistentNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
      
      return true;
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      return false;
    }
  }, []);
  
  // Initial fetch of notifications and unread count
  useEffect(() => {
    if (isAuthenticated() && entity) {
      fetchNotifications(1, false); // Initially load unread notifications
      fetchUnreadCount();
    }
  }, [isAuthenticated, entity, fetchNotifications, fetchUnreadCount]);
  
  // Legacy toast notification functions (kept for backward compatibility)
  const addNotification = useCallback((data) => {
    // This function is kept for backward compatibility but now delegates to handleRealTimeNotification
    handleRealTimeNotification(data);
  }, [handleRealTimeNotification]);

  const clearNotification = (idToClear) => {
    setNotifications(prev => prev.filter(n => n.id !== idToClear));
  };
  
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const value = {
    // Real-time toast notifications (kept for backward compatibility, but empty)
    notifications,
    addNotification,
    clearNotification,
    clearAllNotifications,
    
    // Persistent notifications
    persistentNotifications,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    unreadCount,
    pagination,
    loading,
    
    // Errors
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