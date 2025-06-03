import { useState, useEffect, useCallback } from 'react';
import { fetchFromAPI } from '../../../services/useApiService';

/**
 * Custom hook to fetch restaurants from the API with pagination and filtering.
 * @param {object} [filters={}] - An object containing filter parameters.
 * @param {number} [filters.foodTypeId] - ID of the food type to filter by.
 * @param {number} [filters.latitude] - Latitude for location-based search.
 * @param {number} [filters.longitude] - Longitude for location-based search.
 * @param {number} [filters.radius] - Radius for location-based search (in meters).
 * @param {number} [initialLimit=10] - Number of items to fetch per page.
 * @param {boolean} [enabled=true] - Whether the hook is enabled to fetch data.
 */
const useRestaurants = (filters = {}, initialLimit = 10, enabled = true) => {
  const [restaurants, setRestaurants] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Memoize filters to prevent unnecessary re-renders if the object reference changes but content is same
  // For simplicity in this step, we'll stringify. A more robust solution might involve deep comparison or use-deep-compare-effect.
  const filtersString = JSON.stringify(filters);

  const loadRestaurants = useCallback(async (pageToLoad, currentFilters) => {
    setIsLoading(true);
    if (pageToLoad === 1) {
        setError(null);
    }
    try {
      let endpoint = `/restaurants?page=${pageToLoad}&limit=${initialLimit}`;
      
      if (currentFilters.foodTypeId) {
        endpoint += `&foodTypeId=${currentFilters.foodTypeId}`;
      }
      if (currentFilters.name) {
        endpoint += `&name=${encodeURIComponent(currentFilters.name)}`;
      }
      if (currentFilters.latitude !== undefined && currentFilters.longitude !== undefined && currentFilters.radius !== undefined) {
        endpoint += `&latitude=${currentFilters.latitude}&longitude=${currentFilters.longitude}&radius=${currentFilters.radius}`;
      }      
      if (currentFilters.isOpenNow === true) {
        endpoint += `&isOpenNow=true`;
      }

      const data = await fetchFromAPI(endpoint);

      if (data && data.pagination) { 
        const newItems = data.items || [];
        setRestaurants(prev => pageToLoad === 1 ? newItems : [...prev, ...newItems]);
        setPagination(data.pagination);
        setCurrentPage(data.pagination.currentPage || pageToLoad);
        const morePagesExist = (data.pagination.currentPage || pageToLoad) < (data.pagination.totalPages || 0);
        setHasMore(morePagesExist);

      } else {
        // Fallback if pagination data is missing or data structure is unexpected
        if (pageToLoad === 1) setRestaurants([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error fetching restaurants:", err);
      setError(err.message || 'Could not load restaurants.');
      setHasMore(false); 
    } finally {
      setIsLoading(false);
    }
  }, [initialLimit]); // Only depends on initialLimit, making it stable

  // Effect for initial load and when filters or enabled state change
  useEffect(() => {
    if (!enabled) {
      setRestaurants([]);
      setPagination(null);
      setIsLoading(false);
      setError(null);
      setCurrentPage(1);
      setHasMore(false); 
      return;
    }

    const currentFilters = JSON.parse(filtersString);
    setRestaurants([]); 
    setCurrentPage(1);
    setHasMore(true); 
    loadRestaurants(1, currentFilters);
  }, [filtersString, initialLimit, loadRestaurants, enabled]);

  const loadMoreRestaurants = useCallback(() => {
    if (!enabled || !hasMore || isLoading) {
      return;
    }
    const currentFilters = JSON.parse(filtersString);
    loadRestaurants(currentPage + 1, currentFilters);
  }, [enabled, hasMore, isLoading, currentPage, filtersString, loadRestaurants]);

  return {
    restaurants,
    pagination,
    isLoadingInitial: isLoading && currentPage === 1 && restaurants.length === 0, 
    isLoadingMore: isLoading && (currentPage > 1 || (currentPage === 1 && restaurants.length > 0)),
    error,
    hasMore,
    loadMoreRestaurants,
  };
};

export default useRestaurants; 