import { useState, useEffect, useCallback } from 'react';
import { fetchDataFromEndpoint } from '../../../services/useApiService';
import { API_ENDPOINTS } from '../../../utils/constants';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';

const useRestaurantOrderDetails = (orderId) => {
  const { token, entity } = useAuth();
  const { persistentNotifications } = useNotifications();
  const [order, setOrder] = useState(null);
  const [orderWithArticleDetails, setOrderWithArticleDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processedNotifications, setProcessedNotifications] = useState(new Set());

  // Fetch comprehensive order details from the API
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
      
      if (orderData?.items && Array.isArray(orderData.items) && orderData.items.length > 0) {
        try {
          const articlesData = await fetchDataFromEndpoint(
            API_ENDPOINTS.ARTICLES.RESTAURANT_OWNER,
            'GET',
            null,
            true,
            token
          );
          
          const articlesMap = {};
          if (articlesData?.items) {
            articlesData.items.forEach(article => {
              articlesMap[article.id] = article;
            });
          }
          
          const enhancedItems = orderData.items.map(item => {
            const articleDetail = articlesMap[item.articleId];
            return {
              ...item,
              articleDetail: articleDetail || null,
              articleName: articleDetail?.name || `Article ID: ${item.articleId}`,
              articlePrice: articleDetail?.price || 0,
              articleDescription: articleDetail?.description || '',
              articleImageUrl: articleDetail?.imageUrl || '',
              lineTotal: articleDetail?.price ? (parseFloat(articleDetail.price) * item.quantity) : 0
            };
          });
          
          const enhancedOrder = {
            ...orderData,
            items: enhancedItems,
            totalItems: enhancedItems.reduce((total, item) => total + item.quantity, 0),
            calculatedTotal: enhancedItems.reduce((total, item) => total + item.lineTotal, 0)
          };
          
          setOrderWithArticleDetails(enhancedOrder);
          
        } catch (articleError) {
          console.warn('Failed to fetch article details for order items:', articleError);
          setOrderWithArticleDetails(orderData);
        }
      } else {
        setOrderWithArticleDetails(orderData);
      }
      
    } catch (err) {
      setError(err.details?.message || err.message || 'Could not load order details.');
      setOrder(null);
      setOrderWithArticleDetails(null);
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  const updateOrderStatus = useCallback(async (newStatus) => {
    try {
      await fetchDataFromEndpoint(
        API_ENDPOINTS.ORDERS.BY_ID(orderId),
        'PATCH',
        { status: newStatus },
        true
      );

      setOrder(prevOrder => prevOrder ? ({
        ...prevOrder,
        status: newStatus
      }) : null);
      
      setOrderWithArticleDetails(prevOrder => prevOrder ? ({
        ...prevOrder,
        status: newStatus
      }) : null);

      return { success: true };
    } catch (err) {
      const errorMessage = err.details?.message || err.message || 'Failed to update order status.';
      return { success: false, error: errorMessage };
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
    if (!entity?.restaurantId || loading || !order || persistentNotifications.length === 0) {
      return;
    }

    const newOrderNotifications = persistentNotifications
      .filter(notification => {
        const isRelevantType = ['status_update', 'order_update'].includes(notification.type);
        const isForThisOrder = String(notification.orderId) === String(orderId);
        const isForThisRestaurant = notification.restaurantId === entity.restaurantId;
        const isNotProcessed = !processedNotifications.has(notification.id);
        
        return isRelevantType && isForThisOrder && isForThisRestaurant && isNotProcessed;
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
        setOrder(prevOrder => prevOrder ? ({
          ...prevOrder,
          status: latestStatusUpdate.status
        }) : null);
        
        setOrderWithArticleDetails(prevOrder => prevOrder ? ({
          ...prevOrder,
          status: latestStatusUpdate.status
        }) : null);
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
    orderWithArticleDetails,
    loading, 
    error, 
    refreshOrder,
    updateOrderStatus
  };
};

export default useRestaurantOrderDetails; 