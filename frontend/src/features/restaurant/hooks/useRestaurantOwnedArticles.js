import { useState, useEffect, useCallback } from 'react';
import articleService from '../services/articleService'; // Import the actual service
import { useAuth } from '../../../context/AuthContext'; // Correctly import and use useAuth

const ITEMS_PER_PAGE = 10;

const useRestaurantOwnedArticles = () => {
  const { entity: user } = useAuth(); // Use useAuth() to get context values, and alias entity to user
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMoreArticles, setHasMoreArticles] = useState(true);

  const fetchArticles = useCallback(async (currentPage) => {
    if (!user || user.roles?.includes('ROLE_RESTAURANT') === false || !user.restaurantId) {
      setError('User is not a restaurant, not logged in, or restaurant ID is missing.');
      setLoading(false);
      setInitialLoading(false);
      setHasMoreArticles(false);
      setArticles([]);
      return;
    }

    setLoading(true);
    setError(null);
    if (currentPage === 1) {
      setInitialLoading(true);
    }

    try {
      const response = await articleService.getRestaurantArticles(currentPage, ITEMS_PER_PAGE);
      const responseData = response; // Changed: Assume response is the data payload

      const newArticles = responseData?.items || [];
      const pagination = responseData?.pagination || { currentPage: 1, totalPages: 1 };

      setArticles(prevArticles => currentPage === 1 ? newArticles : [...prevArticles, ...newArticles]);

      const currentP = Number(pagination.currentPage) || 1;
      const totalP = Number(pagination.totalPages) || 1;
      setHasMoreArticles(currentP < totalP);

    } catch (err) {
      console.error("Error fetching articles in hook:", err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch articles');
      if (currentPage === 1) setArticles([]); // Clear articles only if first page fetch fails
    }
    setLoading(false);
    if (currentPage === 1) { // Ensure initialLoading is set to false AFTER the first fetch attempt (success or fail)
        setInitialLoading(false);
    }
  }, [user]); // Dependency array includes user

  useEffect(() => {
    setInitialLoading(true);
    setArticles([]);
    setPage(1);
    setHasMoreArticles(true);
    fetchArticles(1);
  }, [fetchArticles]);

  const fetchMoreArticles = () => {
    if (!loading && hasMoreArticles) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchArticles(nextPage);
    }
  };

  const refreshArticles = useCallback(() => {
    setPage(1);
    fetchArticles(1);
  }, [fetchArticles]);


  return {
    articles,
    loading,
    initialLoading,
    error,
    fetchMoreArticles,
    hasMoreArticles,
    refreshArticles,
    setArticles // Expose setArticles for potential optimistic updates elsewhere
  };
};

export default useRestaurantOwnedArticles; 