import { useState, useEffect, useCallback } from 'react';
import { GOOGLE_MAPS_CONFIG } from '../utils/googleMapsConstants';

export const DEFAULT_LOCATION = {
  name: 'Madrid',
  latitude: GOOGLE_MAPS_CONFIG.MADRID_CENTER.lat,
  longitude: GOOGLE_MAPS_CONFIG.MADRID_CENTER.lng,
  radius: GOOGLE_MAPS_CONFIG.DEFAULT_RADIUS,
  isGeolocated: false,
};

const useGoogleLocation = (initialRadius = GOOGLE_MAPS_CONFIG.DEFAULT_RADIUS) => {
  const [locationInputText, setLocationInputText] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [initialLocationDetermined, setInitialLocationDetermined] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(initialRadius);

  const setDefaultLocation = useCallback(() => {
    setCurrentLocation(DEFAULT_LOCATION);
    setLocationInputText(DEFAULT_LOCATION.name);
    setIsLocationLoading(false);
    setInitialLocationDetermined(true);
  }, []);

  const handleGeolocationSuccess = useCallback((position) => {
    const { latitude, longitude } = position.coords;
    
    setCurrentLocation({
      name: 'Current Location',
      latitude,
      longitude,
      radius: selectedRadius,
      isGeolocated: true,
    });
    setLocationInputText('Current Location');
    setIsLocationLoading(false);
    setInitialLocationDetermined(true);
  }, [selectedRadius]);

  const handleGeolocationError = useCallback(() => {
    setDefaultLocation();
  }, [setDefaultLocation]);

  // Get initial location using browser geolocation
  useEffect(() => {
    if (initialLocationDetermined) {
      return;
    }
    
    setIsLocationLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        handleGeolocationSuccess,
        handleGeolocationError,
        {
          timeout: 10000,
          enableHighAccuracy: false,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      handleGeolocationError();
    }
  }, [initialLocationDetermined, handleGeolocationSuccess, handleGeolocationError]);

  const handleManualLocationSearch = useCallback(() => {
    if (!locationInputText.trim()) {
      setCurrentLocation(prev => ({...DEFAULT_LOCATION, radius: prev?.radius || selectedRadius }));
      setLocationInputText(DEFAULT_LOCATION.name);
      return;
    }
    
  }, [locationInputText, selectedRadius]);
  
  const updateRadius = useCallback((newRadius) => {
    setSelectedRadius(newRadius);
    if (currentLocation) {
      setCurrentLocation(prevLoc => ({ ...prevLoc, radius: newRadius }));
    }
  }, [currentLocation]);

  return {
    currentLocation,
    locationInputText,
    setLocationInputText,
    isLocationLoading,
    handleManualLocationSearch,
    initialLocationDetermined,
    DEFAULT_LOCATION,
    selectedRadius,
    setSelectedRadius: updateRadius,
  };
};

export default useGoogleLocation; 