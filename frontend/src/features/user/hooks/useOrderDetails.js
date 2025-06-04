import { useState, useEffect, useCallback } from 'react';
import { fetchDataFromEndpoint } from '../../../services/useApiService';
import { API_ENDPOINTS } from '../../../utils/constants';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';


const useOrderDetails = (orderId) => {
  const { token, entity } = useAuth();
  const { persistentNotifications } = useNotifications();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processedNotifications, setProcessedNotifications] = useState(new Set());

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId || !token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const orderData = await fetchDataFromEndpoint(
        API_ENDPOINTS.ORDERS.BY_ID(orderId), 
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
    
    const orderUpdates = newOrderNotifications.filter(
      notification => notification.type === 'order_update'
    );
    
    if (orderUpdates.length > 0) {
      fetchOrderDetails();
    }
  }, [persistentNotifications, entity, order, orderId, loading, fetchOrderDetails, processedNotifications]);

  useEffect(() => {
    if (processedNotifications.size > 50) {
      setProcessedNotifications(prev => {
        const newSet = new Set();
        const recentNotifications = Array.from(prev).slice(-20);
        recentNotifications.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  }, [processedNotifications.size]);

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