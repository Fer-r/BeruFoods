import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';
import LoadingFallback from '../components/LoadingFallback';

// Protected route for any authenticated user
export const AuthenticatedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
};

// Protected route for admin users
export const AdminRoute = ({ children }) => {
  const { isAuthenticated, entity, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  const isAdmin = entity && entity.roles && entity.roles.includes('ROLE_ADMIN');

  if (!isAuthenticated() || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
};

// Protected route for general users (not restaurants or admins)
export const UserRoute = ({ children }) => {
  const { isAuthenticated, entity, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  // User is authenticated and is not a restaurant or admin
  const isUser = entity && entity.roles && 
                 !entity.roles.includes('ROLE_RESTAURANT') && 
                 !entity.roles.includes('ROLE_ADMIN');

  if (!isAuthenticated() || !isUser) {
    // Redirect to login or an appropriate page if not a 'user'
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
};

// Protected route for restaurant users
export const RestaurantRoute = ({ children }) => {
  const { isAuthenticated, entity, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  const isRestaurant = entity && entity.roles && entity.roles.includes('ROLE_RESTAURANT');

  if (!isAuthenticated() || !isRestaurant) {
    // Redirect to restaurant login or an appropriate page
    return <Navigate to="/restaurant/login" replace />;
  }

  return children ? children : <Outlet />;
}; 