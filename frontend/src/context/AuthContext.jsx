import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { fetchDataFromEndpoint, isAuthorized } from "../services/useApiService";
import { jwtDecode } from "jwt-decode";

// Helper function to set cookies
function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days*24*60*60*1000));
    expires = "; expires=" + date.toUTCString();
  }
  // For development (HTTP), Secure flag must not be set or be false.
  // For production (HTTPS), Secure flag should be true.
  // Path=/ ensures cookie is available for all paths.
  document.cookie = name + "=" + (value || "")  + expires + "; path=/; SameSite=Lax"; 
}

// Helper function to delete cookies
function deleteCookie(name) {
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
}

const AuthContext = createContext();

// Helper to get Mercure URL from environment variables
const getMercurePublicUrl = () => {
  if (import.meta.env.VITE_MERCURE_PUBLIC_URL) {
    return import.meta.env.VITE_MERCURE_PUBLIC_URL;
  }
  // Fallback for other environments if necessary, or could throw an error
  // console.warn("VITE_MERCURE_PUBLIC_URL not found, Mercure might not work.");
  return null; 
};

export const AuthProvider = ({ children }) => {
  const [entity, setEntity] = useState(() => {
    const storedEntity = localStorage.getItem("authenticatedEntity");
    try {
      return storedEntity ? JSON.parse(storedEntity) : null;
    } catch (e) {
      console.error("Failed to parse stored entity:", e);
      localStorage.removeItem("authenticatedEntity");
      return null;
    }
  });

  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Mercure Notifications State ---
  const [notifications, setNotifications] = useState([]);
  const [notificationError, setNotificationError] = useState(null);
  // ----------------------------------

  const isAuthenticated = useCallback(() => {
    return isAuthorized(); // This function from useApiService likely checks the token validity
  }, []); // Removed isAuthorized from dependencies as it should be stable

  const handleLogin = useCallback(async (endpoint, { email, password }) => {
    setError(null);
    setLoading(true);
    let resultEntityData = null; 
    try {
      const data = await fetchDataFromEndpoint(
        endpoint,
        "POST",
        { email, password },
        false 
      );

      if (data?.token) {
        const decodedToken = jwtDecode(data.token);
        let entityDataToStore = null;

        // Enhanced check for decoded token properties
        if (decodedToken && 
            Array.isArray(decodedToken.roles) && decodedToken.roles.length > 0 &&
            typeof decodedToken.username === 'string' && 
            // Address is optional in JWT as per JWTAuthenticatedListener logic, handle its absence
            (typeof decodedToken.address === 'object' || decodedToken.address === null)
            ) {

          const { username, roles, address } = decodedToken;
          
          entityDataToStore = {
            username,
            roles,
            address: address || null, // Ensure address is null if not present
          };

          if (decodedToken.restaurant_id) {
            entityDataToStore.restaurantId = decodedToken.restaurant_id;
            entityDataToStore.type = 'restaurant'; // Add type for Mercure topic
          } else if (decodedToken.user_id) {
            entityDataToStore.userId = decodedToken.user_id;
            entityDataToStore.type = 'user'; // Add type for Mercure topic
          }

        } else {
          console.error("Token is missing required fields (roles, username) or has invalid types. Decoded token:", decodedToken);
        }

        if (entityDataToStore && entityDataToStore.type) { // Ensure type is set
          setEntity(entityDataToStore);
          setToken(data.token);
          localStorage.setItem("token", data.token);
          setCookie("mercure_authorization", data.token, 7); // Store for 7 days
          localStorage.setItem("authenticatedEntity", JSON.stringify(entityDataToStore));
          resultEntityData = entityDataToStore;
        } else {
          const errorMessage = "Token did not contain valid or complete entity information (type missing).";
          throw new Error(errorMessage); 
        }
      } else {
        const errorMessage = "Invalid response from server during login (missing token).";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      return resultEntityData; 
    } catch (error) {
      console.error(`Error al iniciar sesión en ${endpoint}:`, error);
      const errorMessage = error.details?.message || error.message || "Error desconocido al iniciar sesión";
      setError(errorMessage);
      setEntity(null); // Clear entity on login failure
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("authenticatedEntity");
      throw error; 
    } finally {
      setLoading(false);
    }
  }, [setEntity, setToken, setError, setLoading]);

  const loginUser = useCallback(async ({ email, password }) => {
    return handleLogin("/login", { email, password });
  }, [handleLogin]);

  const loginRestaurant = useCallback(async ({ email, password }) => {
    return handleLogin("/restaurant/login", { email, password });
  }, [handleLogin]);

  const logOut = useCallback(() => {
    setEntity(null);
    setToken(null);
    setError(null);
    setNotifications([]); // Clear notifications on logout
    setNotificationError(null);
    localStorage.removeItem("token");
    localStorage.removeItem("authenticatedEntity");
    deleteCookie("mercure_authorization"); // Delete Mercure cookie on logout
  }, [setEntity, setToken, setError, setNotifications, setNotificationError]);

  // --- Mercure Notification Logic --- 
  useEffect(() => {
    const MERCURE_PUBLIC_URL = getMercurePublicUrl();

    if (!token || !entity?.type || !(entity.userId || entity.restaurantId) || !MERCURE_PUBLIC_URL) {
      setNotifications([]); // Clear if not authenticated or info missing
      setNotificationError(null);
      return;
    }

    // Fetch initial notifications from API
    const fetchInitialNotifications = async () => {
      try {
        const response = await fetchDataFromEndpoint('/notifications', 'GET', null, true);
        if (Array.isArray(response)) {
          setNotifications(response);
        }
      } catch (error) {
        console.error('Failed to fetch initial notifications:', error);
        setNotificationError('Failed to load notifications');
      }
    };

    fetchInitialNotifications();

    let eventSource;
    let topic;
    const entityId = entity.type === 'user' ? entity.userId : entity.restaurantId;

    if (entity.type === 'user') {
      topic = `/users/${entityId}/notifications`;
    } else if (entity.type === 'restaurant') {
      topic = `/restaurants/${entityId}/notifications`;
    } else {
      return; // Unknown entity type
    }

    const connectMercure = () => {
      try {
        const url = new URL(MERCURE_PUBLIC_URL);
        url.searchParams.append('topic', topic);

        console.log(`Connecting to Mercure: ${url.toString()} with credentials`);
        eventSource = new EventSource(url.toString(), {
          withCredentials: true
        });

        eventSource.onmessage = (event) => {
          try {
            const newNotification = JSON.parse(event.data);
            console.log('Received Mercure notification:', newNotification);
            // Add new notification to the start, ensuring no duplicates if events fire rapidly
            setNotifications((prev) => [newNotification, ...prev.filter(n => n.id !== newNotification.id)]);
            setNotificationError(null);
          } catch (parseError) {
            console.error('Failed to parse notification data:', parseError, event.data);
            setNotificationError('Failed to parse incoming notification.');
          }
        };

        eventSource.onerror = (err) => {
          console.error('Mercure EventSource failed:', err);
          setNotificationError('Notification service connection error. May attempt to reconnect.');
          // EventSource has built-in reconnection logic. 
          // If it closes permanently, this error handler will be called with eventSource.readyState === EventSource.CLOSED
          if (eventSource && eventSource.readyState === EventSource.CLOSED) {
            console.log("Mercure connection permanently closed. Will not attempt to reconnect automatically here.");
            // Optionally, you could try to re-initiate connection after a delay
            // For example, if the token was refreshed, this useEffect would re-run.
          }
        };

        eventSource.onopen = () => {
          console.log(`Mercure connection opened for topic: ${topic}`);
          setNotificationError(null);
        };

      } catch (e) {
        console.error('Failed to initialize EventSource for Mercure:', e);
        setNotificationError('Could not connect to notification service.');
      }
    };

    connectMercure();

    return () => {
      if (eventSource) {
        console.log(`Closing Mercure connection for topic: ${topic}`);
        eventSource.close();
      }
      // Optionally clear notifications on disconnect, or keep them until logout
      // setNotifications([]); 
      // setNotificationError(null);
    };
  // entity object itself might be unstable if not memoized, be specific with dependencies
  }, [token, entity?.type, entity?.userId, entity?.restaurantId]); 

  const markNotificationAsRead = useCallback(async (notificationId) => {
    try {
      const response = await fetchDataFromEndpoint(`/notifications/${notificationId}/read`, 'PUT', null, true);
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
      console.log(`Notification ${notificationId} marked as read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      setNotificationError('Failed to update notification');
    }
  }, [setNotifications]);

  const clearAllNotifications = useCallback(async () => {
    try {
      await fetchDataFromEndpoint('/notifications/clear', 'DELETE', null, true);
    setNotifications([]);
      console.log('All notifications cleared');
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      setNotificationError('Failed to clear notifications');
    }
  }, [setNotifications]);
  // ---------------------------------

  const isRestaurant = isAuthenticated() && entity?.roles?.includes('ROLE_RESTAURANT');
  const isUser = isAuthenticated() && entity?.roles?.includes('ROLE_USER') && !isRestaurant;

  const value = {
    entity, 
    token,
    isAuthenticated,
    loginUser,
    loginRestaurant,
    logOut,
    error,
    loading,
    setEntity, // Exposing setEntity might be for specific use cases, generally manage through login/logout
    isRestaurant,
    isUser,
    // Mercure related values
    notifications,
    notificationError,
    markNotificationAsRead,
    clearAllNotifications,
    setNotifications // Exposing setNotifications for direct manipulation (e.g. from a dedicated notifications page)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe estar dentro del proveedor AuthProvider");
  }
  return context;
}; 