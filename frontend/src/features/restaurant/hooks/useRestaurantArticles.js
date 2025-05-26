import { useState, useEffect, useCallback } from 'react';
import { fetchDataFromEndpoint } from '../../../services/useApiService'; // Updated import

const ARTICLES_PER_PAGE = 10;

const useRestaurantArticles = (restaurantId) => {
  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMoreArticles, setHasMoreArticles] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchArticles = useCallback(async (currentPage) => {
    if (!restaurantId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        restaurantId: restaurantId,
        page: currentPage.toString(),
        limit: ARTICLES_PER_PAGE.toString(),
        available: 'true', // Optionally, only fetch available articles
      });
      const endpoint = `/articles?${params.toString()}`;
      
      // The fetchDataFromEndpoint returns the data directly (not nested under a .data property like axios)
      const responseData = await fetchDataFromEndpoint(endpoint, 'GET', null, false);

      const newArticles = responseData.items || [];
      const pagination = responseData.pagination;

      setArticles(prev => currentPage === 1 ? newArticles : [...prev, ...newArticles]);
      setHasMoreArticles(pagination.currentPage < pagination.totalPages);
      // setPage(currentPage + 1); // Page is incremented by the API response or by our logic
      // The backend pagination already gives us the next page or totalPages, 
      // so it's better to set page based on the next logical page to fetch
      if (pagination.currentPage < pagination.totalPages) {
        setPage(pagination.currentPage + 1);
      } else {
        setPage(pagination.currentPage); // Or keep it at the last page
      }

    } catch (err) {
      console.error("Error fetching articles:", err);
      setError(err.details?.message || err.message || 'Failed to fetch articles');
      // If an error occurs, we might want to stop trying to fetch more
      // setHasMoreArticles(false); 
    } finally {
      setLoading(false);
      if (initialLoading && currentPage === 1) setInitialLoading(false); // Ensure initialLoading is set to false only after the first fetch
    }
  }, [restaurantId, initialLoading]); // initialLoading was part of the dependency array causing re-fetches, it should be managed internally or removed if fetchArticles is only called on ID change and scroll

  useEffect(() => {
    // Reset and fetch when restaurantId changes
    setArticles([]);
    setPage(1);
    setHasMoreArticles(true);
    setInitialLoading(true);
    setError(null);
    if (restaurantId) {
      fetchArticles(1); // Initial fetch for page 1
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]); // fetchArticles is memoized with restaurantId, so this effect runs when restaurantId changes

  const fetchMoreArticles = () => {
    // Only fetch more if not currently loading and there are more articles
    if (!loading && hasMoreArticles && !initialLoading) { // also ensure initial load is complete
      fetchArticles(page);
    }
  };

  return {
    articles,
    fetchMoreArticles,
    hasMoreArticles,
    loading,
    error,
    initialLoading,
  };
};

export default useRestaurantArticles; 