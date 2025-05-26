import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx'; // Import useAuth

const RestaurantRedirect = () => {
  const navigate = useNavigate();
  const { isAuthenticated, entity } = useAuth(); // Get isAuthenticated and entity from useAuth

  useEffect(() => {
    if (!isAuthenticated()) {
      // If not authenticated, always go to login
      navigate('/restaurant/login');
    } else {
      // If authenticated, check roles from the entity
      let hasRestaurantRole = false;
      if (entity && entity.roles && Array.isArray(entity.roles)) {
        hasRestaurantRole = entity.roles.includes('ROLE_RESTAURANT');
      }

      if (hasRestaurantRole) {
        navigate('/restaurant/dashboard');
      } else {
        // If authenticated but not a restaurant, redirect to home
        navigate('/');
      }
    }
  }, [navigate, isAuthenticated, entity]);

  // Render nothing or a loading indicator while redirecting
  return null;
};

export default RestaurantRedirect; 