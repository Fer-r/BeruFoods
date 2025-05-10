import { createContext, useContext, useState } from "react";
import { fetchDataFromEndpoint, isAuthorized } from "../services/useApiService";

// Create the AuthContext
const AuthContext = createContext();

// AuthProvider component
export const AuthProvider = ({ children }) => {
  // State to hold the authenticated entity (user or restaurant)
  const [entity, setEntity] = useState(() => {
    const storedEntity = localStorage.getItem("authenticatedEntity");
    return storedEntity ? JSON.parse(storedEntity) : null;
  });

  // State to hold the authentication token
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  // State for error messages
  const [error, setError] = useState(null);

  // State for loading indicator
  const [loading, setLoading] = useState(false);

  // Function to check if the user is authenticated and token is valid
  const isAuthenticated = () => {
    return isAuthorized();
  };

  // Helper function to handle the login process for a given endpoint
  const handleLogin = async (endpoint, { email, password }) => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchDataFromEndpoint(
        endpoint,
        "POST",
        { email, password },
        false // Login does not require authentication initially
      );

      // Assuming the backend returns the authenticated entity in `data.entity`
      // and the token in `data.token`
      if (data && data.entity && data.token) {
        setEntity(data.entity);
        setToken(data.token);
        localStorage.setItem("token", data.token);
        localStorage.setItem("authenticatedEntity", JSON.stringify(data.entity));
      } else {
        // Handle case where backend response is not as expected
        const errorMessage = "Invalid response from server during login.";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      return data.entity; // Return the authenticated entity
    } catch (error) {
      console.error(`Error al iniciar sesión en ${endpoint}:`, error);
      // Check if the error is an API error with details
      const errorMessage = error.details?.message || error.message || "Error desconocido al iniciar sesión";
      setError(errorMessage);
      throw error; // Re-throw to handle in the component
    } finally {
      setLoading(false);
    }
  };

  // Function to handle user login
  const loginUser = async ({ email, password }) => {
    return handleLogin("/login", { email, password });
  };

  // Function to handle restaurant login
  const loginRestaurant = async ({ email, password }) => {
    return handleLogin("/restaurant/login", { email, password });
  };

  // Function to handle logout
  const logOut = () => {
    setEntity(null);
    setToken(null);
    setError(null);
    localStorage.removeItem("token");
    localStorage.removeItem("authenticatedEntity");
  };

  // Value object provided by the context
  const value = {
    entity, // Can be user or restaurant object
    token,
    isAuthenticated,
    loginUser,
    loginRestaurant,
    logOut,
    error,
    loading,
    setEntity // Allow setting the entity manually if needed
  };

  // Provide the context value to children components
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe estar dentro del proveedor AuthProvider");
  }
  return context;
}; 