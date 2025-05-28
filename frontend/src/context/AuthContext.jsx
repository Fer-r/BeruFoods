import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react";
import { fetchDataFromEndpoint, isAuthorized } from "../services/useApiService";
import { jwtDecode } from "jwt-decode";

// Constants
const COOKIE_EXPIRY_DAYS = 7;
const MAX_RECONNECT_ATTEMPTS = 5;
const MAX_RECONNECT_DELAY_MS = 30000;
const BASE_RECONNECT_DELAY_MS = 1000;
const NOTIFICATION_API_ENDPOINTS = {
  LIST: '/notifications',
  MARK_READ: '/notifications/{id}/read',
  CLEAR_ALL: '/notifications/clear'
};

// Error Messages
const ERROR_MESSAGES = {
  PARSE_ENTITY: 'Failed to parse stored entity',
  INVALID_TOKEN: 'Token is missing required fields (roles, username) or has invalid types',
  INVALID_RESPONSE: 'Invalid response from server during login (missing token)',
  LOGIN_GENERAL: 'Error desconocido al iniciar sesión',
  NOTIFICATION_PARSE: 'Failed to parse incoming notification',
  NOTIFICATION_LOAD: 'Failed to load notifications',
  NOTIFICATION_UPDATE: 'Failed to update notification',
  NOTIFICATION_CLEAR: 'Failed to clear notifications',
  CONNECTION_LOST: 'Connection lost. Please refresh the page',
  CONNECTION_FAILED: 'Could not connect to notification service'
};

// Storage Keys
const STORAGE_KEYS = {
  TOKEN: 'token',
  ENTITY: 'authenticatedEntity'
};

// Cookie Names
const COOKIE_NAMES = {
  MERCURE_AUTH: 'mercure_authorization'
};

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

const getMercurePublicUrl = () => {
  return import.meta.env.VITE_MERCURE_PUBLIC_URL || null;
};

const createMercureTopic = (entityType, entityId) => {
  return entityType === 'user' 
    ? `/users/${entityId}/notifications`
    : `/restaurants/${entityId}/notifications`;
};

const calculateReconnectDelay = (attemptNumber) => {
  return Math.min(BASE_RECONNECT_DELAY_MS * Math.pow(2, attemptNumber), MAX_RECONNECT_DELAY_MS);
};

const getStoredEntity = () => {
  const storedEntity = localStorage.getItem(STORAGE_KEYS.ENTITY);
  try {
    return storedEntity ? JSON.parse(storedEntity) : null;
  } catch (e) {
    console.error(ERROR_MESSAGES.PARSE_ENTITY, e);
    localStorage.removeItem(STORAGE_KEYS.ENTITY);
    return null;
  }
};

const validateTokenPayload = (decodedToken) => {
  return decodedToken && 
    Array.isArray(decodedToken.roles) && 
    decodedToken.roles.length > 0 &&
    typeof decodedToken.username === 'string' && 
    (typeof decodedToken.address === 'object' || decodedToken.address === null);
};

const createEntityFromToken = (decodedToken) => {
  const { username, roles, address } = decodedToken;
  
  const entityData = {
    username,
    roles,
    address: address || null,
  };

  if (decodedToken.restaurant_id) {
    entityData.restaurantId = decodedToken.restaurant_id;
    entityData.type = 'restaurant';
  } else if (decodedToken.user_id) {
    entityData.userId = decodedToken.user_id;
    entityData.type = 'user';
  }

  return entityData;
};

const clearAuthStorage = () => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.ENTITY);
  deleteCookie(COOKIE_NAMES.MERCURE_AUTH);
};

const saveAuthData = (token, entityData) => {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  setCookie(COOKIE_NAMES.MERCURE_AUTH, token, COOKIE_EXPIRY_DAYS);
  localStorage.setItem(STORAGE_KEYS.ENTITY, JSON.stringify(entityData));
};

export const AuthProvider = ({ children }) => {
  const [entity, setEntity] = useState(getStoredEntity);
  const [token, setToken] = useState(localStorage.getItem(STORAGE_KEYS.TOKEN) || null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationError, setNotificationError] = useState(null);

  // Stable entity values to prevent unnecessary Mercure reconnections
  const stableEntityValues = useMemo(() => {
    if (!entity) return null;
    return {
      type: entity.type,
      id: entity.userId || entity.restaurantId
    };
  }, [entity?.type, entity?.userId, entity?.restaurantId]);

  // Track current connection to prevent unnecessary reconnections
  const currentConnectionRef = useRef(null);
  const connectionCleanupRef = useRef(null);

  const isAuthenticated = useCallback(() => {
    return isAuthorized();
  }, []);

  const fetchInitialNotifications = async () => {
    try {
      const response = await fetchDataFromEndpoint(NOTIFICATION_API_ENDPOINTS.LIST, 'GET', null, true);
      if (Array.isArray(response)) {
        setNotifications(response);
      }
    } catch (error) {
      console.error('Failed to fetch initial notifications:', error);
      setNotificationError(ERROR_MESSAGES.NOTIFICATION_LOAD);
    }
  };

  const handleLogin = useCallback(async (endpoint, { email, password }) => {
    setError(null);
    setLoading(true);
    
    try {
      const data = await fetchDataFromEndpoint(endpoint, "POST", { email, password }, false);

      if (!data?.token) {
        throw new Error(ERROR_MESSAGES.INVALID_RESPONSE);
      }

      const decodedToken = jwtDecode(data.token);
      
      if (!validateTokenPayload(decodedToken)) {
        console.error(ERROR_MESSAGES.INVALID_TOKEN, decodedToken);
        throw new Error(ERROR_MESSAGES.INVALID_TOKEN);
      }

      const entityData = createEntityFromToken(decodedToken);
      
      if (!entityData.type) {
        throw new Error("Token did not contain valid or complete entity information (type missing).");
      }

      setEntity(entityData);
      setToken(data.token);
      saveAuthData(data.token, entityData);
      
      return entityData;
    } catch (error) {
      console.error(`Error al iniciar sesión en ${endpoint}:`, error);
      const errorMessage = error.details?.message || error.message || ERROR_MESSAGES.LOGIN_GENERAL;
      setError(errorMessage);
      setEntity(null);
      setToken(null);
      clearAuthStorage();
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

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
    setNotifications([]);
    setNotificationError(null);
    clearAuthStorage();
  }, []);

  const handleMercureMessage = (event, entityType) => {
    try {
      const newNotification = JSON.parse(event.data);
      console.log(`[${entityType}] Received Mercure notification:`, newNotification);
      setNotifications((prev) => {
        console.log(`[${entityType}] Updating notifications, current count:`, prev.length);
        const updated = [
          newNotification, 
          ...prev.filter(n => n.id !== newNotification.id)
        ];
        console.log(`[${entityType}] New notifications count:`, updated.length);
        return updated;
      });
      setNotificationError(null);
      return true;
    } catch (parseError) {
      console.error('Failed to parse notification data:', parseError, event.data);
      setNotificationError(ERROR_MESSAGES.NOTIFICATION_PARSE);
      return false;
    }
  };

  const handleMercureError = (err, eventSource, entityType, reconnectAttempts, setReconnectAttempts, connectMercure) => {
    console.error(`[${entityType}] Mercure EventSource error:`, {
      readyState: eventSource?.readyState,
      url: eventSource?.url,
      error: err
    });
    
    if (eventSource?.readyState === EventSource.CLOSED) {
      console.log(`[${entityType}] Connection closed, attempting reconnect...`);
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const newAttempts = reconnectAttempts + 1;
        setReconnectAttempts(newAttempts);
        const delay = calculateReconnectDelay(newAttempts);
        console.log(`[${entityType}] Reconnecting in ${delay}ms (attempt ${newAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
        
        return setTimeout(() => {
          connectMercure();
        }, delay);
      } else {
        console.error(`[${entityType}] Max reconnection attempts reached`);
        setNotificationError(ERROR_MESSAGES.CONNECTION_LOST);
      }
    }
    return null;
  };

  const createMercureConnection = (topic, entityType) => {
    const MERCURE_PUBLIC_URL = getMercurePublicUrl();
    let eventSource;
    let reconnectTimeout;
    let statusInterval;
    let reconnectAttempts = 0;
    
    const setReconnectAttempts = (attempts) => {
      reconnectAttempts = attempts;
    };

    const connectMercure = () => {
      try {
        if (eventSource) {
          console.log(`[${entityType}] Closing existing EventSource`);
          eventSource.close();
        }

        const url = new URL(MERCURE_PUBLIC_URL);
        url.searchParams.append('topic', topic);

        console.log(`[${entityType}] Connecting to Mercure topic: ${topic}`);
        console.log(`[${entityType}] Full URL: ${url.toString()}`);
        
        eventSource = new EventSource(url.toString(), {
          withCredentials: true
        });

        console.log(`[${entityType}] EventSource created, readyState:`, eventSource.readyState);

        // Add event listeners for debugging
        eventSource.addEventListener('open', (e) => {
          console.log(`[${entityType}] addEventListener 'open' fired:`, e);
        });

        eventSource.addEventListener('message', (e) => {
          console.log(`[${entityType}] addEventListener 'message' fired:`, e);
          console.log(`[${entityType}] Message data:`, e.data);
          
          // ACTUALLY HANDLE THE MESSAGE HERE TOO
          if (handleMercureMessage(e, entityType)) {
            reconnectAttempts = 0;
          }
        });

        eventSource.addEventListener('error', (e) => {
          console.log(`[${entityType}] addEventListener 'error' fired:`, e);
          console.log(`[${entityType}] Error details:`, {
            target: e.target,
            readyState: e.target?.readyState,
            type: e.type
          });
        });

        eventSource.onmessage = (event) => {
          console.log(`[${entityType}] EventSource onmessage triggered!`, event);
          if (handleMercureMessage(event, entityType)) {
            reconnectAttempts = 0;
          }
        };

        eventSource.onerror = (err) => {
          console.log(`[${entityType}] EventSource onerror triggered, readyState:`, eventSource?.readyState, err);
          reconnectTimeout = handleMercureError(err, eventSource, entityType, reconnectAttempts, setReconnectAttempts, connectMercure);
        };

        eventSource.onopen = () => {
          console.log(`[${entityType}] EventSource onopen triggered! Connection opened for topic: ${topic}`);
          console.log(`[${entityType}] EventSource readyState:`, eventSource.readyState);
          setNotificationError(null);
          reconnectAttempts = 0;
          
          // Debug: Check connection status every 10 seconds
          statusInterval = setInterval(() => {
            if (eventSource) {
              console.log(`[${entityType}] EventSource status check - readyState:`, eventSource.readyState, 'URL:', eventSource.url);
            } else {
              clearInterval(statusInterval);
            }
          }, 10000);
        };

      } catch (e) {
        console.error('Failed to initialize EventSource for Mercure:', e);
        setNotificationError(ERROR_MESSAGES.CONNECTION_FAILED);
      }
    };

    connectMercure();

    return () => {
      console.log(`[${entityType}] === CLEANING UP MERCURE CONNECTION ===`);
      console.log(`[${entityType}] Cleanup reason: useEffect dependency change or component unmount`);
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        console.log(`[${entityType}] Cleared reconnect timeout`);
      }
      if (statusInterval) {
        clearInterval(statusInterval);
        console.log(`[${entityType}] Cleared status interval`);
      }
      if (eventSource) {
        console.log(`[${entityType}] Closing EventSource, readyState was:`, eventSource.readyState);
        eventSource.close();
      }
    };
  };

  useEffect(() => {
    const MERCURE_PUBLIC_URL = getMercurePublicUrl();
    
    console.log('=== Mercure useEffect triggered ===');
    console.log('Current dependencies:');
    console.log('- Token exists:', !!token);
    console.log('- Token value:', token ? `${token.substring(0, 20)}...` : 'null');
    console.log('- Stable entity values:', stableEntityValues);
    console.log('- Mercure URL:', MERCURE_PUBLIC_URL);

    // Create stable identifiers
    const stableKey = `${token ? 'has_token' : 'no_token'}-${stableEntityValues?.type || 'no_type'}-${stableEntityValues?.id || 'no_id'}`;
    console.log('- Stable connection key:', stableKey);
    console.log('- Previous connection key:', currentConnectionRef.current);

    if (!token || !stableEntityValues?.type || !stableEntityValues?.id || !MERCURE_PUBLIC_URL) {
      console.log('=== Mercure conditions not met, clearing notifications ===');
      setNotifications([]);
      setNotificationError(null);
      
      // Cleanup existing connection
      if (connectionCleanupRef.current) {
        console.log('=== Cleaning up existing connection due to unmet conditions ===');
        connectionCleanupRef.current();
        connectionCleanupRef.current = null;
        currentConnectionRef.current = null;
      }
      return;
    }

    // Check if we need to reconnect
    if (currentConnectionRef.current === stableKey) {
      console.log('=== Connection key unchanged, skipping reconnection ===');
      return;
    }

    // Cleanup previous connection if exists
    if (connectionCleanupRef.current) {
      console.log('=== Cleaning up previous connection for new key ===');
      connectionCleanupRef.current();
    }

    console.log('=== Mercure conditions met, setting up NEW connection ===');
    currentConnectionRef.current = stableKey;
    
    fetchInitialNotifications();

    const topic = createMercureTopic(stableEntityValues.type, stableEntityValues.id);
    
    console.log('=== Creating Mercure connection ===');
    console.log('Entity ID:', stableEntityValues.id);
    console.log('Topic:', topic);
    
    // Check if mercure_authorization cookie exists
    const cookies = document.cookie;
    const mercureCookie = cookies.split('; ').find(row => row.startsWith('mercure_authorization='));
    console.log('Mercure cookie exists:', !!mercureCookie);
    
    if (mercureCookie) {
      try {
        const cookieValue = mercureCookie.split('=')[1];
        const decodedToken = jwtDecode(cookieValue);
        console.log('JWT Token decoded:', decodedToken);
        console.log('JWT Mercure claims:', decodedToken.mercure);
        console.log('JWT Subscribe topics:', decodedToken.mercure?.subscribe);
      } catch (e) {
        console.error('Failed to decode JWT token:', e);
      }
    }
    
    const cleanup = createMercureConnection(topic, stableEntityValues.type);
    connectionCleanupRef.current = cleanup;
    
    return () => {
      // This cleanup only runs on component unmount
      console.log('=== Component unmounting, cleaning up connection ===');
      if (connectionCleanupRef.current) {
        connectionCleanupRef.current();
        connectionCleanupRef.current = null;
        currentConnectionRef.current = null;
      }
    };
  }, [token, stableEntityValues]);

  const markNotificationAsRead = useCallback(async (notificationId) => {
    try {
      const endpoint = NOTIFICATION_API_ENDPOINTS.MARK_READ.replace('{id}', notificationId);
      await fetchDataFromEndpoint(endpoint, 'PUT', null, true);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      setNotificationError(ERROR_MESSAGES.NOTIFICATION_UPDATE);
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    try {
      await fetchDataFromEndpoint(NOTIFICATION_API_ENDPOINTS.CLEAR_ALL, 'DELETE', null, true);
      setNotifications([]);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      setNotificationError(ERROR_MESSAGES.NOTIFICATION_CLEAR);
    }
  }, []);

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
    setEntity,
    isRestaurant,
    isUser,
    notifications,
    notificationError,
    markNotificationAsRead,
    clearAllNotifications,
    setNotifications
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