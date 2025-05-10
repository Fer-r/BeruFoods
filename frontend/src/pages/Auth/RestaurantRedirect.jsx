import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { jwtDecode } from 'jwt-decode'; // Ensure jwt-decode is installed

const RestaurantRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('jwtToken'); // Adjust 'jwtToken' if your key is different
    let hasRestaurantRole = false;

    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        // Assuming roles are stored in an array under 'roles' key
        if (decodedToken.roles && Array.isArray(decodedToken.roles)) {
          hasRestaurantRole = decodedToken.roles.includes('ROLE_RESTAURANT');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        // Handle invalid token, e.g., remove it and redirect to login
        localStorage.removeItem('jwtToken');
      }
    }

    if (hasRestaurantRole) {
      navigate('/restaurant/dashboard');
    } else {
      navigate('/restaurant/login');
    }
  }, [navigate]);

  // Render nothing or a loading indicator while redirecting
  return null;
};

export default RestaurantRedirect; 