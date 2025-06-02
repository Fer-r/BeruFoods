import { useState, useEffect, useCallback } from 'react';
import { fetchDataFromEndpoint } from '../../../services/useApiService';
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
      // Fetch the order details
      const orderData = await fetchDataFromEndpoint(
        `/orders/${orderId}`, 
        'GET', 
        null, 
        true, 
        token
      );
      
      setOrder(orderData);
      
      // If the order has items, fetch article details for those items
      if (orderData?.items && Array.isArray(orderData.items) && orderData.items.length > 0) {
        try {
          // Get all article IDs from the order items
          const articleIds = orderData.items.map(item => item.articleId);
          
          // Fetch restaurant's articles to get full details
          const articlesData = await fetchDataFromEndpoint(
            '/articles/restaurant-owner',
            'GET',
            null,
            true,
            token
          );
          
          // Create a map of articles by ID for quick lookup
          const articlesMap = {};
          if (articlesData?.items) {
            articlesData.items.forEach(article => {
              articlesMap[article.id] = article;
            });
          }
          
          // Enhance order items with full article details
          const enhancedItems = orderData.items.map(item => {
            const articleDetail = articlesMap[item.articleId];
            return {
              ...item,
              articleDetail: articleDetail || null,
              // Include commonly needed article properties directly in the item
              articleName: articleDetail?.name || `Article ID: ${item.articleId}`,
              articlePrice: articleDetail?.price || 0,
              articleDescription: articleDetail?.description || '',
              articleImageUrl: articleDetail?.imageUrl || '',
              // Calculate line total
              lineTotal: articleDetail?.price ? (parseFloat(articleDetail.price) * item.quantity) : 0
            };
          });
          
          // Create enhanced order object with enriched items
          const enhancedOrder = {
            ...orderData,
            items: enhancedItems,
            // Add summary information
            totalItems: enhancedItems.reduce((total, item) => total + item.quantity, 0),
            calculatedTotal: enhancedItems.reduce((total, item) => total + item.lineTotal, 0)
          };
          
          setOrderWithArticleDetails(enhancedOrder);
          
        } catch (articleError) {
          console.warn('Failed to fetch article details for order items:', articleError);
          // Still set the basic order even if article details fail
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

  // Update order status function
  const updateOrderStatus = useCallback(async (newStatus) => {
    try {
      await fetchDataFromEndpoint(
        `/orders/${orderId}`,
        'PATCH',
        { status: newStatus },
        true // isProtected
      );

      // Update the order in the local state
      setOrder(prevOrder => prevOrder ? ({
        ...prevOrder,
        status: newStatus
      }) : null);
      
      // Also update the enhanced order
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
    // Only process notifications if we have loaded order and restaurant ID
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
    orderWithArticleDetails,
    loading, 
    error, 
    refreshOrder,
    updateOrderStatus
  };
};

export default useRestaurantOrderDetails; 