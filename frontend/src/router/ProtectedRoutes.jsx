import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';
import LoadingFallback from '../components/common/LoadingFallback';

/**
 * @component AuthenticatedRoute
 * A protected route component that only allows access to authenticated users.
 * It relies on the `useAuth()` hook to check the user's authentication status and loading state.
 * While the authentication status is loading, it displays a `LoadingFallback` component.
 * If the user is not authenticated, it redirects them to the home page ("/").
 * If authenticated, it renders its `children` prop or an `<Outlet />` if `children` is not provided.
 *
 * @param {object} props - The component's props.
 * @param {React.ReactNode} [props.children] - Optional children to render if the user is authenticated.
 *                                             If not provided, an `<Outlet />` is rendered to allow nested routes.
 * @returns {JSX.Element} The rendered children/Outlet or a redirect/loading fallback.
 */
export const AuthenticatedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
};

/**
 * @component AdminRoute
 * A protected route component that only allows access to authenticated users with an 'ROLE_ADMIN' role.
 * It uses `useAuth()` to check authentication status, user entity (for roles), and loading state.
 * Displays `LoadingFallback` during auth loading.
 * If the user is not authenticated or does not have the 'ROLE_ADMIN' role, it redirects to "/".
 * Otherwise, it renders its `children` or an `<Outlet />`.
 *
 * @param {object} props - The component's props.
 * @param {React.ReactNode} [props.children] - Optional children to render if conditions are met.
 *                                             If not provided, an `<Outlet />` is rendered.
 * @returns {JSX.Element} The rendered children/Outlet or a redirect/loading fallback.
 */
export const AdminRoute = ({ children }) => {
  const { isAuthenticated, entity, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  const isAdmin = entity && entity.roles && entity.roles.includes('ROLE_ADMIN');

  if (!isAuthenticated() || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
};

/**
 * @component UserRoute
 * A protected route component for authenticated users who are general users (i.e., not restaurants or admins).
 * It relies on `useAuth()` for authentication status, user entity (to check roles), and loading state.
 * Shows `LoadingFallback` while auth status is loading.
 * If the user is not authenticated, or if they have 'ROLE_RESTAURANT' or 'ROLE_ADMIN', it redirects to "/".
 * If the conditions are met (authenticated and is a general user), it renders `children` or an `<Outlet />`.
 *
 * @param {object} props - The component's props.
 * @param {React.ReactNode} [props.children] - Optional children to render if conditions are met.
 *                                             If not provided, an `<Outlet />` is rendered.
 * @returns {JSX.Element} The rendered children/Outlet or a redirect/loading fallback.
 */
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
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
};

/**
 * @component RestaurantRoute
 * A protected route component specifically for authenticated users with a 'ROLE_RESTAURANT' role.
 * It uses the `useAuth()` hook to determine authentication status, user entity (for role checking), and loading state.
 * Displays `LoadingFallback` when the authentication state is loading.
 * If the user is not authenticated or does not possess the 'ROLE_RESTAURANT' role, they are redirected to "/restaurant/login".
 * If authenticated and has the correct role, it renders its `children` or an `<Outlet />`.
 *
 * @param {object} props - The component's props.
 * @param {React.ReactNode} [props.children] - Optional children to render if conditions are met.
 *                                             If not provided, an `<Outlet />` is rendered.
 * @returns {JSX.Element} The rendered children/Outlet or a redirect/loading fallback.
 */
export const RestaurantRoute = ({ children }) => {
  const { isAuthenticated, entity, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  const isRestaurant = entity && entity.roles && entity.roles.includes('ROLE_RESTAURANT');

  if (!isAuthenticated() || !isRestaurant) {
    return <Navigate to="/restaurant/login" replace />;
  }

  return children ? children : <Outlet />;
}; 