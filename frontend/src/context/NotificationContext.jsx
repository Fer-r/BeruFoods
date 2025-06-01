import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { fetchDataFromEndpoint } from '../services/useApiService'; // Kilo Code: Import useApiService

const NotificationContext = createContext();
const MERCURE_PUBLIC_URL = 'https://localhost/.well-known/mercure'; // Kilo Code: Use configured public URL

export const NotificationProvider = ({ children }) => {
  const { entity, isAuthenticated, token: apiToken } = useAuth(); // Kilo Code: Get apiToken for Mercure token fetch
  const [notifications, setNotifications] = useState([]);
  const [eventSource, setEventSource] = useState(null);
  const [mercureToken, setMercureToken] = useState(null); // Kilo Code: State for Mercure token
  const [error, setError] = useState(null); // Kilo Code: State for errors

  // Kilo Code: Function to add a formatted notification
  const addNotification = useCallback((data) => {
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
    
    // Create a unique ID for the notification for key prop and clearing
    const newNotification = { id: Date.now(), ...data, displayMessage: message };
    setNotifications(prev => [newNotification, ...prev]);

    // Optional: Show browser notification
    if (Notification.permission === 'granted') {
      new Notification(message);
    }
  }, []);


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
        addNotification(data); // Kilo Code: Use addNotification function
      } catch (e) {
        console.error("Failed to parse Mercure message data:", event.data, e);
        // Optionally, add a generic error notification
        addNotification({ message: "Received an invalid update." });
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

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (es) {
        es.close();
        setEventSource(null);
        console.log("Mercure EventSource closed on component unmount or dependency change.");
      }
    };
    // Kilo Code: Add mercureToken to dependency array
  }, [entity, isAuthenticated, mercureToken, addNotification, apiToken]);

  const clearNotification = (idToClear) => { // Kilo Code: Clear by ID
    setNotifications(prev => prev.filter(n => n.id !== idToClear));
  };
  
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const value = {
    notifications,
    addNotification, // Kilo Code: Expose addNotification
    clearNotification,
    clearAllNotifications, // Kilo Code: Expose clearAllNotifications
    mercureError: error // Kilo Code: Expose error state
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