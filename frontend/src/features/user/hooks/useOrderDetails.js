import { useState, useEffect, useCallback } from 'react';
import { fetchDataFromEndpoint } from '../../../services/useApiService';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';


const useOrderDetails = (orderId) => {
  const { token, entity } = useAuth();
  const { persistentNotifications } = useNotifications();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processedNotifications, setProcessedNotifications] = useState(new Set());

  // Fetch order details from the API
  const fetchOrderDetails = useCallback(async () => {
    if (!orderId || !token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const orderData = await fetchDataFromEndpoint(
        `/orders/${orderId}`, 
        'GET', 
        null, 
        true, 
        token
      );
      setOrder(orderData);
    } catch (err) {
      setError(err.details?.message || err.message || 'Could not load order details.');
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  // Initial fetch when the component mounts or orderId/token changes
  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  /**
   * Listen for real-time notifications about this specific order
   * See full documentation in: frontend/src/docs/REALTIME_UPDATES.md
   *
   * This effect processes Mercure notifications from NotificationContext
   * to update the order details in real-time when the status changes
   * or other order information is updated.
   */
  useEffect(() => {
    // Only process notifications if we have loaded order and user ID
    if (!entity?.userId || loading || !order || persistentNotifications.length === 0) {
      return;
    }

    const newOrderNotifications = persistentNotifications
      .filter(notification => {
        const isRelevantType = ['status_update', 'order_update'].includes(notification.type);
        const isForThisOrder = String(notification.orderId) === String(orderId);
        const isForThisUser = notification.userId === entity.userId;
        const isNotProcessed = !processedNotifications.has(notification.id);
        
        return isRelevantType && isForThisOrder && isForThisUser && isNotProcessed;
      });

    if (newOrderNotifications.length === 0) {
      return;
    }

    setProcessedNotifications(prev => {
      const updated = new Set(prev);
      newOrderNotifications.forEach(notification => {
        updated.add(notification.id);
      });
      return updated;
    });

    // Handle status updates
    const statusUpdates = newOrderNotifications.filter(
      notification => notification.type === 'status_update' && notification.status
    );
    
    if (statusUpdates.length > 0) {
      const latestStatusUpdate = statusUpdates.reduce((latest, current) => {
        if (!latest || new Date(current.createdAt) > new Date(latest.createdAt)) {
          return current;
        }
        return latest;
      }, null);
      
      if (latestStatusUpdate && latestStatusUpdate.status) {
        setOrder(prevOrder => ({
          ...prevOrder,
          status: latestStatusUpdate.status
        }));
      }
    }
    
    // Handle general order updates that may require a full refresh
    const orderUpdates = newOrderNotifications.filter(
      notification => notification.type === 'order_update'
    );
    
    if (orderUpdates.length > 0) {
      fetchOrderDetails();
    }
  }, [persistentNotifications, entity, order, orderId, loading, fetchOrderDetails, processedNotifications]);

  // Add cleanup mechanism to prevent memory leaks from accumulating notifications
  useEffect(() => {
    // Clean up processed notifications when they exceed a certain threshold
    if (processedNotifications.size > 50) {
      setProcessedNotifications(prev => {
        const newSet = new Set();
        // Convert to array, get the most recent 20 notifications
        const recentNotifications = Array.from(prev).slice(-20);
        recentNotifications.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  }, [processedNotifications.size]);

  // Manual refresh function
  const refreshOrder = useCallback(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  return { 
    order, 
    loading, 
    error, 
    refreshOrder 
  };
};

export default useOrderDetails;