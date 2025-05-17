import { createContext, useContext, useState, useCallback } from "react";
import { fetchDataFromEndpoint, isAuthorized } from "../services/useApiService";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [entity, setEntity] = useState(() => {
    const storedEntity = localStorage.getItem("authenticatedEntity");
    return storedEntity ? JSON.parse(storedEntity) : null;
  });

  const [token, setToken] = useState(localStorage.getItem("token") || null);

  const [error, setError] = useState(null);

  const [loading, setLoading] = useState(false);

  const isAuthenticated = useCallback(() => {
    return isAuthorized();
  }, [isAuthorized]);

  const handleLogin = useCallback(async (endpoint, { email, password }) => {
    setError(null);
    setLoading(true);
    let resultEntityData = null; 
    try {
      const data = await fetchDataFromEndpoint(
        endpoint,
        "POST",
        { email, password },
        false 
      );

      if (data?.token) {
        const decodedToken = jwtDecode(data.token);
        let entityDataToStore = null;

        if (decodedToken && 
            Array.isArray(decodedToken.roles) && decodedToken.roles.length > 0 &&
            typeof decodedToken.username === 'string' && 
            typeof decodedToken.address === 'object' && decodedToken.address !== null &&
            typeof decodedToken.address.address_line !== 'undefined' 
            ) {

          const { username, roles, address } = decodedToken;
          
          entityDataToStore = {
            username,
            roles,
            address, 
          };

          if (decodedToken.restaurant_id) {
            entityDataToStore.restaurantId = decodedToken.restaurant_id;
          } else if (decodedToken.user_id) {
            entityDataToStore.userId = decodedToken.user_id;
          }

        } else {
          console.error("Token is missing required fields (roles, username, address with address_line) or has invalid types. Decoded token:", decodedToken);
        }

        if (entityDataToStore) {
          setEntity(entityDataToStore);
          setToken(data.token);
          localStorage.setItem("token", data.token);
          localStorage.setItem("authenticatedEntity", JSON.stringify(entityDataToStore));
          resultEntityData = entityDataToStore;
        } else {
          const errorMessage = "Token did not contain valid or complete entity information.";
          throw new Error(errorMessage); 
        }
      } else {
        const errorMessage = "Invalid response from server during login (missing token).";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      return resultEntityData; 
    } catch (error) {
      console.error(`Error al iniciar sesión en ${endpoint}:`, error);
      const errorMessage = error.details?.message || error.message || "Error desconocido al iniciar sesión";
      setError(errorMessage);
      throw error; 
    } finally {
      setLoading(false);
    }
  }, [setEntity, setToken, setError, setLoading]);

  const loginUser = useCallback(async ({ email, password }) => {
    return handleLogin("/login", { email, password });
  }, [handleLogin]);

  const loginRestaurant = useCallback(async ({ email, password }) => {
    return handleLogin("/restaurant/login", { email, password });
  }, [handleLogin]);

  const logOut = useCallback(() => {
    setEntity(null);
    setToken(null);
    setError(null);
    localStorage.removeItem("token");
    localStorage.removeItem("authenticatedEntity");
  }, [setEntity, setToken, setError]);

  const isRestaurant = isAuthenticated() && entity?.roles?.includes('ROLE_RESTAURANT');
  const isUser = isAuthenticated() && entity?.roles?.includes('ROLE_USER') && !isRestaurant;

  const value = {
    entity, 
    token,
    isAuthenticated,
    loginUser,
    loginRestaurant,
    logOut,
    error,
    loading,
    setEntity,
    isRestaurant,
    isUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe estar dentro del proveedor AuthProvider");
  }
  return context;
}; 