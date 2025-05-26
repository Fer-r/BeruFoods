import { useState, useEffect, useCallback } from 'react';
import { fetchDataFromEndpoint } from '../../../services/useApiService';
import { useAuth } from '../../../context/AuthContext';

// Helper function to convert date filter to date parameters
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

const useRestaurantOrders = (initialPageSize = 10) => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false); // For subsequent page loads
  const [initialLoading, setInitialLoading] = useState(true); // For the very first load
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

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
        setLoading(true); // loading is for subsequent fetches
    }
    setError(null);

    try {
      // Build query params
      let queryParams = `page=${currentPage}&limit=${initialPageSize}`;
      if (statusFilter !== 'all') {
        queryParams += `&status=${statusFilter}`;
      }

      // Add date filtering
      if (dateFilter !== 'all') {
        const dateParams = getDateFilterParams(dateFilter);
        if (dateParams.dateFrom) {
          queryParams += `&dateFrom=${dateParams.dateFrom}`;
        }
        if (dateParams.dateTo) {
          queryParams += `&dateTo=${dateParams.dateTo}`;
        }
      }

      // The backend OrderController's index action handles pagination and restaurant-specific filtering
      const data = await fetchDataFromEndpoint(
        `/orders?${queryParams}`,
        'GET',
        null,
        true // isProtected
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
      console.error("Failed to fetch restaurant orders:", err);
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
    // Fetch initial orders when the component mounts, token changes, or filters change
    fetchOrders(1, statusFilter, dateFilter);
  }, [fetchOrders, statusFilter, dateFilter]); // fetchOrders is memoized and includes token in its deps

  const fetchMoreOrders = () => {
    // Only fetch more if there are more orders and not currently loading (either initial or subsequent)
    if (hasMore && !loading && !initialLoading) {
      fetchOrders(page, statusFilter, dateFilter);
    }
  };

  const refreshOrders = useCallback(() => {
    setPage(1);
    setOrders([]); // Clear existing orders
    setHasMore(true); // Reset hasMore
    fetchOrders(1, statusFilter, dateFilter); // Fetch from the first page
  }, [fetchOrders, statusFilter, dateFilter]);

  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      await fetchDataFromEndpoint(
        `/orders/${orderId}`,
        'PATCH',
        { status: newStatus },
        true // isProtected
      );

      // Update the order in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );

      return { success: true };
    } catch (err) {
      console.error("Failed to update order status:", err);
      const errorMessage = err.details?.message || err.message || 'Failed to update order status.';
      return { success: false, error: errorMessage };
    }
  }, [token]);

  const filterOrdersByStatus = useCallback((status) => {
    setStatusFilter(status);
    setPage(1);
    setOrders([]); // Clear existing orders
    setHasMore(true); // Reset hasMore
    // fetchOrders will be called by the useEffect when statusFilter changes
  }, []);

  const filterOrdersByDate = useCallback((dateFilter) => {
    setDateFilter(dateFilter);
    setPage(1);
    setOrders([]); // Clear existing orders
    setHasMore(true); // Reset hasMore
    // fetchOrders will be called by the useEffect when dateFilter changes
  }, []);

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