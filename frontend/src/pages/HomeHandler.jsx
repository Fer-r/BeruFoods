import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import LoadingFallback from '../components/common/LoadingFallback';
import { Suspense, lazy } from 'react';
import { ROUTES } from '../utils/constants';

const Home = lazy(() => import("./home/Home.jsx"));

const HomeHandler = () => {
  const { loading, isRestaurant } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (isRestaurant) {
    return <Navigate to={ROUTES.RESTAURANT.DASHBOARD} replace />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Home />
    </Suspense>
  );
};

export default HomeHandler; 