import { useState, useEffect, useCallback } from 'react';
import { fetchDataFromEndpoint } from '../../../services/useApiService';
import { API_ENDPOINTS, PAGINATION } from '../../../utils/constants';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';

const getDateFilterParams = (dateFilter) => {
  const today = new Date();
  let dateFrom = null;
  let dateTo = null;

  switch (dateFilter) {
    case 'today': {
      dateFrom = today.toISOString().split('T')[0];
      dateTo = today.toISOString().split('T')[0];
      break;
    }
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      dateFrom = yesterday.toISOString().split('T')[0];
      dateTo = yesterday.toISOString().split('T')[0];
      break;
    }
    case 'last7days': {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      dateFrom = sevenDaysAgo.toISOString().split('T')[0];
      dateTo = today.toISOString().split('T')[0];
      break;
    }
    case 'last30days': {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
      dateTo = today.toISOString().split('T')[0];
      break;
    }
    default:
      return { dateFrom: null, dateTo: null };
  }

  return { dateFrom, dateTo };
};

const useRestaurantOrders = (initialPageSize = PAGINATION.DEFAULT_LIMIT) => {
  const { token, entity } = useAuth();
  const { persistentNotifications } = useNotifications();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [processedNotifications, setProcessedNotifications] = useState(new Set());

  const fetchOrders = useCallback(async (currentPage, statusFilter = 'all', dateFilter = 'all') => {
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
      let queryParams = `page=${currentPage}&limit=${initialPageSize}`;
      if (statusFilter !== 'all') {
        queryParams += `&status=${statusFilter}`;
      }

      if (dateFilter !== 'all') {
        const dateParams = getDateFilterParams(dateFilter);
        if (dateParams.dateFrom) {
          queryParams += `&dateFrom=${dateParams.dateFrom}`;
        }
        if (dateParams.dateTo) {
          queryParams += `&dateTo=${dateParams.dateTo}`;
        }
      }

      const data = await fetchDataFromEndpoint(
        API_ENDPOINTS.ORDERS.RESTAURANT_ORDERS(queryParams),
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
      const errorMessage = err.details?.message || err.message || 'Could not load orders. Please try again later.';
      setError(errorMessage);
      if (currentPage === 1) setOrders([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [token, initialPageSize]);

  useEffect(() => {
    fetchOrders(1, statusFilter, dateFilter);
  }, [fetchOrders, statusFilter, dateFilter]);

  const fetchMoreOrders = () => {
    if (hasMore && !loading && !initialLoading) {
      fetchOrders(page, statusFilter, dateFilter);
    }
  };

  const refreshOrders = useCallback(() => {
    setPage(1);
    setOrders([]);
    setHasMore(true);
    fetchOrders(1, statusFilter, dateFilter);
  }, [fetchOrders, statusFilter, dateFilter]);

  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      await fetchDataFromEndpoint(
        API_ENDPOINTS.ORDERS.BY_ID(orderId),
        'PATCH',
        { status: newStatus },
        true
      );

      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );

      return { success: true };
    } catch (err) {
      const errorMessage = err.details?.message || err.message || 'Failed to update order status.';
      return { success: false, error: errorMessage };
    }
  }, [token]);

  const filterOrdersByStatus = useCallback((status) => {
    setStatusFilter(status);
    setPage(1);
    setOrders([]);
    setHasMore(true);
  }, []);

  const filterOrdersByDate = useCallback((dateFilter) => {
    setDateFilter(dateFilter);
    setPage(1);
    setOrders([]);
    setHasMore(true);
  }, []);

  /**
   * Listen for real-time notifications about orders
   * See full documentation in: frontend/src/docs/REALTIME_UPDATES.md
   *
   * This effect processes Mercure notifications from NotificationContext
   * to update the orders list when changes occur, either by refreshing
   * the entire list or updating specific orders in-place.
   */
  useEffect(() => {
    if (!entity?.restaurantId || initialLoading || persistentNotifications.length === 0) {
      return;
    }

    const newOrderNotifications = persistentNotifications
      .filter(notification =>
        ['new_order', 'status_update', 'order_update'].includes(notification.type) &&
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

    const hasNewOrders = newOrderNotifications.some(
      notification => notification.type === 'new_order'
    );
    
    if (hasNewOrders) {
      refreshOrders();
      return;
    }
    
    const statusUpdates = newOrderNotifications.filter(
      notification => notification.type === 'status_update' && notification.orderId
    );
    
    if (statusUpdates.length > 0) {
      const latestStatusByOrderId = {};
      statusUpdates.forEach(notification => {
        if (notification.status) {
          latestStatusByOrderId[notification.orderId] = notification.status;
        }
      });
      
      const orderIdsToUpdate = Object.keys(latestStatusByOrderId);
      const existingOrderIds = new Set(orders.map(order => order.id));
      const needsRefresh = orderIdsToUpdate.some(orderId => {
        const orderStatus = latestStatusByOrderId[orderId];
        return !existingOrderIds.has(orderId) &&
               (statusFilter === 'all' || statusFilter === orderStatus);
      });
      
      if (needsRefresh) {
        refreshOrders();
      } else {
        setOrders(prevOrders =>
          prevOrders.map(order => {
            if (orderIdsToUpdate.includes(order.id) && latestStatusByOrderId[order.id]) {
              return { ...order, status: latestStatusByOrderId[order.id] };
            }
            return order;
          })
        );
      }
    }
  }, [persistentNotifications, entity, orders, statusFilter, refreshOrders, initialLoading]);

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

  return {
    orders,
    loading,
    initialLoading,
    error,
    hasMore,
    fetchMoreOrders,
    refreshOrders,
    updateOrderStatus,
    filterOrdersByStatus,
    filterOrdersByDate,
    statusFilter,
    dateFilter
  };
};

export default useRestaurantOrders;