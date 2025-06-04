import { jwtDecode } from "jwt-decode";

const BASE_URL = import.meta.env.VITE_URL_API;

/**
 * Retrieves the Authorization header with the JWT token if available in localStorage.
 *
 * @returns {object} An object containing the Authorization header if a token exists,
 *                   otherwise an empty object.
 * @example
 * // Returns { Authorization: "Bearer <token>" } or {}
 * getAuthHeader();
 */
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Constructs a Headers object for API requests.
 *
 * @param {boolean} [includeAuth=false] - Whether to include the Authorization header.
 * @param {string | null} [contentType="application/json"] - The Content-Type header value.
 *                                                       If null, Content-Type header is omitted (e.g., for FormData).
 * @returns {Headers} A Headers object configured with Accept, Content-Type (if specified),
 *                    and Authorization (if requested and available).
 */
const getHeaders = (includeAuth = false, contentType = "application/json") => {
  const headers = {
    Accept: "application/json",
  };
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  return includeAuth ? { ...headers, ...getAuthHeader() } : headers;
};

/**
 * Generic function to fetch data from a specified API endpoint.
 * It handles request configuration, authorization, and error parsing.
 *
 * @async
 * @param {string} endpoint - The API endpoint to fetch data from (e.g., "/users").
 * @param {string} [method="GET"] - The HTTP method to use (e.g., "GET", "POST", "PUT", "DELETE").
 * @param {object | FormData | null} [data=null] - The data to send with the request.
 *                                                 For "GET" or "DELETE" requests, this is typically null.
 *                                                 Can be a plain object (will be JSON.stringified) or FormData.
 * @param {boolean} [requiresAuth=false] - Whether the request requires authentication.
 *                                         If true, it checks `isAuthorized()` and throws `AuthorizationError` if not.
 * @returns {Promise<any>} A promise that resolves to the JSON response from the API.
 *                         Returns `null` if the response is empty (e.g., 204 No Content for DELETE).
 * @throws {AuthorizationError} If `requiresAuth` is true and the user is not authorized or the token is expired.
 * @throws {ApiError} If the API response is not ok (e.g., 4xx or 5xx status codes).
 *                    The error object will contain a `details` property with parsed error information from the API if available.
 * @throws {Error} For network errors or other unexpected issues during the fetch operation.
 */
const fetchDataFromEndpoint = async (endpoint, method = "GET", data = null, requiresAuth = false) => {
  if (requiresAuth && !isAuthorized()) {
    const error = new Error("User is not authorized or token expired.");
    error.name = 'AuthorizationError';
    throw error;
  }

  let headers;
  let body;

  if (data instanceof FormData) {
    headers = getHeaders(requiresAuth, null);
    body = data;
  } else if (data) {
    headers = getHeaders(requiresAuth, "application/json");
    body = JSON.stringify(data);
  } else {
    headers = getHeaders(requiresAuth, "application/json");
  }

  const config = {
    method: method,
    headers: headers,
  };

  if (body && method !== "GET" && method !== "DELETE") {
    config.body = body;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      let errorData = { message: `API Request Failed: ${response.status} ${response.statusText}` };
      try {
        const parsedError = await response.json();
        errorData = { ...errorData, ...parsedError, status: response.status };
      } catch (parseError) {
        console.warn(`Could not parse error response body for ${method} ${endpoint}:`, parseError);
      }
      const error = new Error(errorData.detail || errorData.message || 'An unknown API error occurred');
      error.name = 'ApiError';
      error.details = errorData;
      throw error;
    }

    if (method === "DELETE" && response.status === 204) {
      return null;
    }
    const len = response.headers.get("content-length");
    const ct  = response.headers.get("content-type") ?? "";
    if (response.status === 204 || len === "0" || !ct.includes("application/json")) {
      return null;
    }
    return await response.json();

  } catch (error) {
    if (error.name === 'ApiError') {
        console.error(`API Error (${method} ${endpoint}) - Status: ${error.details?.status}:`, error.message, error.details);
    } else if (error.name === 'AuthorizationError') {
        console.warn(`Authorization Error (${method} ${endpoint}):`, error.message);
    } else {
        console.error(`Network or unexpected error during API call (${method} ${endpoint}):`, error);
    }
    throw error;
  }
};

/**
 * Fetches data from a public API endpoint using the GET method.
 *
 * @async
 * @param {string} endpoint - The API endpoint to fetch from.
 * @returns {Promise<any>} A promise that resolves to the JSON response from the API.
 * @throws {ApiError} If the API response is not ok.
 * @throws {Error} For network or other unexpected errors.
 */
const fetchFromAPI = (endpoint) => fetchDataFromEndpoint(endpoint, "GET", null, false);

/**
 * Sends data to an authenticated API endpoint using the POST method.
 *
 * @async
 * @param {string} endpoint - The API endpoint to post to.
 * @param {object | FormData} data - The data to send in the request body.
 * @returns {Promise<any>} A promise that resolves to the JSON response from the API.
 * @throws {AuthorizationError} If the user is not authorized.
 * @throws {ApiError} If the API response is not ok.
 * @throws {Error} For network or other unexpected errors.
 */
const postToAPI = (endpoint, data) =>
  fetchDataFromEndpoint(endpoint, "POST", data, true);

/**
 * Sends data to an authenticated API endpoint using the PUT method.
 *
 * @async
 * @param {string} endpoint - The API endpoint to send the PUT request to.
 * @param {object | FormData} data - The data to send in the request body.
 * @returns {Promise<any>} A promise that resolves to the JSON response from the API.
 * @throws {AuthorizationError} If the user is not authorized.
 * @throws {ApiError} If the API response is not ok.
 * @throws {Error} For network or other unexpected errors.
 */
const putToAPI = (endpoint, data) =>
  fetchDataFromEndpoint(endpoint, "PUT", data, true);

/**
 * Sends a DELETE request to an authenticated API endpoint.
 *
 * @async
 * @param {string} endpoint - The API endpoint to send the DELETE request to.
 * @returns {Promise<null>} A promise that resolves to null if the deletion is successful (204 No Content).
 * @throws {AuthorizationError} If the user is not authorized.
 * @throws {ApiError} If the API response is not ok.
 * @throws {Error} For network or other unexpected errors.
 */
const deleteFromAPI = (endpoint) =>
  fetchDataFromEndpoint(endpoint, "DELETE", null, true);

/**
 * Sends JSON data to a public API endpoint using the POST method.
 *
 * @async
 * @param {string} endpoint - The API endpoint to post to.
 * @param {object} data - The JSON data to send in the request body.
 * @returns {Promise<any>} A promise that resolves to the JSON response from the API.
 * @throws {ApiError} If the API response is not ok.
 * @throws {Error} For network or other unexpected errors.
 */
const postPublicJSONToAPI = (endpoint, data) =>
  fetchDataFromEndpoint(endpoint, "POST", data, false);

/**
 * Sends FormData to a public API endpoint using the POST method.
 * This is typically used for file uploads.
 *
 * @async
 * @param {string} endpoint - The API endpoint to post to.
 * @param {FormData} formData - The FormData object to send.
 * @returns {Promise<any>} A promise that resolves to the JSON response from the API.
 * @throws {ApiError} If the API response is not ok.
 * @throws {Error} For network or other unexpected errors.
 */
const postFormDataToAPI = (endpoint, formData) =>
  fetchDataFromEndpoint(endpoint, "POST", formData, false);

/**
 * Checks if the user's JWT token (stored in localStorage) is present, valid, and not expired.
 * If the token is invalid or expired, it is removed from localStorage.
 *
 * @returns {boolean} True if the user is authorized (token exists, is valid, and not expired), false otherwise.
 */
const isAuthorized = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    return false;
  }
  try {
    const decodedToken = jwtDecode(token);
    if (typeof decodedToken.exp !== 'number') {
        console.warn("Token does not contain a valid 'exp' claim.");
        localStorage.removeItem("token");
        return false;
    }
    const currentTime = Date.now() / 1000;
    if (decodedToken.exp <= currentTime) {
        console.warn("Token has expired.");
        localStorage.removeItem("token");
        return false;
    }
    return true;
  } catch (error) {
    console.error("Error decoding token:", error);
    localStorage.removeItem("token");
    return false;
  }
};

export {
  fetchFromAPI,
  postToAPI,
  putToAPI,
  deleteFromAPI,
  postPublicJSONToAPI,
  postFormDataToAPI,
  isAuthorized,
  fetchDataFromEndpoint,
};
