import { useState, useEffect, useCallback } from 'react';
import { fetchDataFromEndpoint } from '../../../services/useApiService';

const useRestaurantDetails = (restaurantId) => {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRestaurant = useCallback(async () => {
    if (!restaurantId) {
      setRestaurant(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Assuming your API endpoint for a single restaurant is /restaurants/{id}
      const data = await fetchDataFromEndpoint(`/restaurants/${restaurantId}`, 'GET', null, false);
      setRestaurant(data);
    } catch (err) {
      console.error(`Error fetching restaurant details for ID ${restaurantId}:`, err);
      setError(err.details?.message || err.message || 'Failed to fetch restaurant details');
      setRestaurant(null); // Clear restaurant data on error
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  return { restaurant, loading, error, refetch: fetchRestaurant };
};

export default useRestaurantDetails; 