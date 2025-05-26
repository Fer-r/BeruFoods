import { useState, useEffect, useCallback } from 'react';
import { fetchDataFromEndpoint } from '../../../services/useApiService';
import { useAuth } from '../../../context/AuthContext';

const useUserOrders = (initialPageSize = 10) => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false); // For subsequent page loads
  const [initialLoading, setInitialLoading] = useState(true); // For the very first load
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

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
        setLoading(true); // loading is for subsequent fetches
    }
    setError(null);

    try {
      // The backend OrderController's index action handles pagination and user-specific filtering
      const data = await fetchDataFromEndpoint(
        `/orders?page=${currentPage}&limit=${initialPageSize}`,
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
      console.error("Failed to fetch user orders:", err);
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
    // Fetch initial orders when the component mounts or token changes
    fetchOrders(1);
  }, [fetchOrders]); // fetchOrders is memoized and includes token in its deps

  const fetchMoreOrders = () => {
    // Only fetch more if there are more orders and not currently loading (either initial or subsequent)
    if (hasMore && !loading && !initialLoading) {
      fetchOrders(page);
    }
  };

  const refreshOrders = useCallback(() => {
    setPage(1);
    setOrders([]); // Clear existing orders
    setHasMore(true); // Reset hasMore
    fetchOrders(1); // Fetch from the first page
  }, [fetchOrders]);


  return { orders, loading, initialLoading, error, hasMore, fetchMoreOrders, refreshOrders };
};

export default useUserOrders; 