import { useState, useEffect } from 'react';
import { fetchDataFromEndpoint } from '../../../services/useApiService';
import { API_ENDPOINTS } from '../../../utils/constants';

/**
 * Custom hook to fetch available food types from the API.
 *
 * @returns {{foodTypes: Array<object>, isLoading: boolean, error: string|null}}
 *          An object containing the fetched food types, loading state, and any error message.
 */
const useFoodTypes = () => {
  const [foodTypes, setFoodTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFoodTypes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchDataFromEndpoint(API_ENDPOINTS.FOOD_TYPES);
        const types = data['hydra:member'] || data || [];
        setFoodTypes(types);
      } catch (err) {
        console.error("Error fetching food types:", err);
        setError(err.message || 'Could not load food types.');
      } finally {
        setIsLoading(false);
      }
    };

    loadFoodTypes();
  }, []);

  return { foodTypes, isLoading, error };
};

export default useFoodTypes; 