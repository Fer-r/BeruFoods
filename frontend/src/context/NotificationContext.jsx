import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { entity, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [eventSource, setEventSource] = useState(null);

  useEffect(() => {
    if (!isAuthenticated() || !entity) {
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
      }
      return;
    }

    // Determine topics to subscribe to based on user type
    let topics = [];
    if (entity.restaurantId) {
      topics.push(`restaurant/${entity.restaurantId}/orders`);
    } else if (entity.userId) {
      topics.push(`user/${entity.userId}/orders`);
    }

    if (topics.length === 0) return;

    // Create URL with topics
    const url = new URL('/.well-known/mercure', window.location.origin);
    topics.forEach(topic => url.searchParams.append('topic', topic));

    // Create EventSource
    const es = new EventSource(url);

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setNotifications(prev => [data, ...prev]);

      // Optional: Show browser notification
      if (Notification.permission === 'granted') {
        new Notification(data.message);
      }
    };

    es.onerror = (error) => {
      console.error('EventSource failed:', error);
    };

    setEventSource(es);

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (es) {
        es.close();
      }
    };
  }, [entity, isAuthenticated]);

  const clearNotification = (index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  const value = {
    notifications,
    clearNotification
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