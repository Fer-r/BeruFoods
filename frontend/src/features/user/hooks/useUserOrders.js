import { useState, useEffect, useCallback } from 'react';
import { fetchDataFromEndpoint } from '../../../services/useApiService';
import { API_ENDPOINTS, PAGINATION } from '../../../utils/constants';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';

/**
 * Hook for managing user orders with real-time updates.
 * Simple approach: refresh orders whenever we get a relevant notification.
 */
const useUserOrders = (initialPageSize = PAGINATION.DEFAULT_LIMIT) => {
  const { token, entity } = useAuth();
  const { persistentNotifications } = useNotifications();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [processedNotifications, setProcessedNotifications] = useState(new Set());

  const fetchOrders = useCallback(async (currentPage) => {
    if (!token) {
      setError("Authentication token not found. Please log in.");
      setLoading(false);
      setInitialLoading(false);
      setHasMore(false);
      return;
    }

    if (currentPage === 1) {
      setInitialLoading(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await fetchDataFromEndpoint(
        API_ENDPOINTS.ORDERS.USER_ORDERS(currentPage, initialPageSize),
        'GET',
        null,
        true
      );

      if (data && data.items) {
        setOrders(prevOrders => currentPage === 1 ? data.items : [...prevOrders, ...data.items]);
        setHasMore(data.items.length > 0 && data.pagination && data.pagination.currentPage < data.pagination.totalPages);
        setPage(currentPage + 1);
      } else {
        setHasMore(false);
        if (currentPage === 1) setOrders([]); 
      }
    } catch (err) {
      const errorMessage = err.details?.message || err.message || 'Could not load your orders. Please try again later.';
      setError(errorMessage);
      if (currentPage === 1) setOrders([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [token, initialPageSize]);

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const fetchMoreOrders = () => {
    if (hasMore && !loading && !initialLoading) {
      fetchOrders(page);
    }
  };

  const refreshOrders = useCallback(() => {
    setPage(1);
    setOrders([]);
    setHasMore(true);
    fetchOrders(1);
  }, [fetchOrders]);

  useEffect(() => {
    if (!entity?.userId || initialLoading || persistentNotifications.length === 0) {
      return;
    }

    const newOrderNotifications = persistentNotifications
      .filter(notification =>
        ['new_order', 'order_status_change', 'order_update'].includes(notification.type) &&
        !processedNotifications.has(notification.id)
      );

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

    refreshOrders();

  }, [persistentNotifications, entity, refreshOrders, initialLoading]);

  useEffect(() => {
    if (processedNotifications.size > 100) {
      setProcessedNotifications(prev => {
        const newSet = new Set();
        const recentNotifications = Array.from(prev).slice(-50);
        recentNotifications.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  }, [processedNotifications.size]);

  return { orders, loading, initialLoading, error, hasMore, fetchMoreOrders, refreshOrders };
};

export default useUserOrders;