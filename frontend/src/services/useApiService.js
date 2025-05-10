import { jwtDecode } from "jwt-decode";

const BASE_URL = import.meta.env.VITE_URL_API;

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getHeaders = (includeAuth = false, contentType = "application/json") => {
  const headers = {
    Accept: "application/json",
  };
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  return includeAuth ? { ...headers, ...getAuthHeader() } : headers;
};

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
    if (response.status === 204 || response.headers.get("content-length") === "0") {
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

const fetchFromAPI = (endpoint) => fetchDataFromEndpoint(endpoint, "GET", null, false);

const postToAPI = (endpoint, data) =>
  fetchDataFromEndpoint(endpoint, "POST", data, true);

const putToAPI = (endpoint, data) =>
  fetchDataFromEndpoint(endpoint, "PUT", data, true);

const deleteFromAPI = (endpoint) =>
  fetchDataFromEndpoint(endpoint, "DELETE", null, true);

const postPublicJSONToAPI = (endpoint, data) =>
  fetchDataFromEndpoint(endpoint, "POST", data, false);

const postFormDataToAPI = (endpoint, formData) =>
  fetchDataFromEndpoint(endpoint, "POST", formData, false);

const isAuthorized = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    return false;
  }
  try {
    const decodedToken = jwtDecode(token);
    if (typeof decodedToken.exp !== 'number') {
        console.warn("Token does not contain an 'exp' claim.");
        return false;
    }
    const currentTime = Date.now() / 1000;
    return decodedToken.exp > currentTime;
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
