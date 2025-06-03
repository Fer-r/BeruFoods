import { useState, useEffect } from 'react';
import { fetchDataFromEndpoint } from '../../../services/useApiService';
import { useAuth } from '../../../context/AuthContext';

const useUserProfile = () => {
  const { entity, logOut } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserProfile = async () => {
    if (!entity?.userId) {
      logOut();
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchDataFromEndpoint(
        `/users/${entity.userId}`,
        'GET',
        null,
        true
      );
      setUserData(data);
    } catch (err) {
      setError(err.details?.message || err.message || 'Failed to fetch user profile.');
      if (err.details?.status === 401 || err.details?.status === 403) {
        logOut();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (profileData) => {
    if (!entity?.userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetchDataFromEndpoint(
      `/users/${entity.userId}`,
      'PUT',
      profileData,
      true
    );

    // Update local state with the response data
    if (response) {
      setUserData(response);
    }

    return response;
  };

  useEffect(() => {
    fetchUserProfile();
  }, [entity?.userId]);

  return {
    userData,
    isLoading,
    error,
    refetch: fetchUserProfile,
    updateProfile: updateUserProfile,
    setError
  };
};

export default useUserProfile; 