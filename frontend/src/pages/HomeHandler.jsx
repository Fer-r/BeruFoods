import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import LoadingFallback from '../components/LoadingFallback';
import { Suspense, lazy } from 'react';

const Home = lazy(() => import("../pages/Home/Home.jsx"));

const HomeHandler = () => {
  const { isAuthenticated, entity, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  const isRestaurant = entity && entity.roles && entity.roles.includes('ROLE_RESTAURANT');

  if (isAuthenticated() && isRestaurant) {
    return <Navigate to="/restaurant/dashboard" replace />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Home />
    </Suspense>
  );
};

export default HomeHandler; 