import { fetchDataFromEndpoint } from '../../../services/useApiService'; // Import the core fetch utility
import { API_ENDPOINTS } from '../../../utils/constants';

/**
 * Fetches articles for the currently logged-in restaurant owner with pagination.
 * This uses a dedicated endpoint that returns all articles for the owner.
 * @param {number} page - The page number for pagination.
 * @param {number} limit - The number of items per page.
 * @returns {Promise<Object>} The API response with articles and pagination info.
 */
const getRestaurantArticles = (page = 1, limit = 10) => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  return fetchDataFromEndpoint(`${API_ENDPOINTS.ARTICLES.RESTAURANT_OWNER}?${queryParams.toString()}`, 'GET', null, true);
};

/**
 * Fetches a single article by its ID. (Public or owned, depends on backend voter for other actions)
 * @param {string} articleId - The ID of the article.
 * @returns {Promise<Object>} The API response with the article data.
 */
const getArticleById = (articleId) => {
  return fetchDataFromEndpoint(API_ENDPOINTS.ARTICLES.BY_ID(articleId), 'GET', null, true); // Auth might be true if details are sensitive
};

/**
 * Creates a new article. (Restaurant owner action)
 * @param {FormData} formData - The article data, including imageFile if present.
 * @returns {Promise<Object>} The API response with the created article data.
 */
const createArticle = (formData) => {
  return fetchDataFromEndpoint(API_ENDPOINTS.ARTICLES.BASE, 'POST', formData, true);
};

/**
 * Updates an existing article. (Restaurant owner action)
 * @param {string} articleId - The ID of the article to update.
 * @param {FormData} formData - The updated article data, including imageFile if present.
 * @returns {Promise<Object>} The API response.
 */
const updateArticle = (articleId, formData) => {
  return fetchDataFromEndpoint(API_ENDPOINTS.ARTICLES.BY_ID(articleId), 'POST', formData, true);
};

/**
 * Deletes an article by its ID. (Restaurant owner action)
 * @param {string} articleId - The ID of the article to delete.
 * @returns {Promise<Object>} The API response.
 */
const deleteArticle = (articleId) => {
  return fetchDataFromEndpoint(API_ENDPOINTS.ARTICLES.BY_ID(articleId), 'DELETE', null, true);
};

// This function would be for fetching articles publicly, e.g., for a customer view.
// It uses the original /api/articles endpoint which now defaults to available=true.
const getPublicArticlesByRestaurant = (restaurantId, page = 1, limit = 10, availableOnly = true) => {
    const queryParams = new URLSearchParams({
        restaurantId,
        page: page.toString(),
        limit: limit.toString(),
    });
    if (availableOnly === false) { // Only add if explicitly wanting unavailable or all (if backend supports available=all)
        queryParams.append('available', 'false'); 
    } // If availableOnly is true, we rely on the backend default which is now available=true

    return fetchDataFromEndpoint(`${API_ENDPOINTS.ARTICLES.BASE}?${queryParams.toString()}`, 'GET', null, false); // Public, so auth is false
}

const articleService = {
  getRestaurantArticles, // For restaurant owner management
  getPublicArticlesByRestaurant, // For public views
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
};

export default articleService; 