import { useState, useEffect, useCallback } from 'react';
import { GOOGLE_MAPS_CONFIG } from '../utils/googleMapsConstants';

/**
 * Default location object used when geolocation fails or is unavailable
 * @type {Object}
 */
export const DEFAULT_LOCATION = {
  name: 'Madrid',
  latitude: GOOGLE_MAPS_CONFIG.MADRID_CENTER.lat,
  longitude: GOOGLE_MAPS_CONFIG.MADRID_CENTER.lng,
  radius: GOOGLE_MAPS_CONFIG.DEFAULT_RADIUS,
  isGeolocated: false,
};

/**
 * Custom hook for managing location data with Google Maps integration.
 * Provides functionality for getting the user's current location via browser geolocation,
 * handling manual location searches, and managing location-related state.
 *
 * @param {number} initialRadius - Initial search radius in meters
 * @returns {Object} Location state and functions
 * @property {Object|null} currentLocation - Current location object with coordinates and metadata
 * @property {string} locationInputText - Text displayed in the location input field
 * @property {function} setLocationInputText - Function to update the location input text
 * @property {boolean} isLocationLoading - Whether location is currently being determined
 * @property {function} handleManualLocationSearch - Function to handle manual location search
 * @property {boolean} initialLocationDetermined - Whether initial location has been determined
 * @property {Object} DEFAULT_LOCATION - Default location object (Madrid)
 * @property {number} selectedRadius - Currently selected search radius in meters
 * @property {function} setSelectedRadius - Function to update the selected radius
 */
const useGoogleLocation = (initialRadius = GOOGLE_MAPS_CONFIG.DEFAULT_RADIUS) => {
  const [locationInputText, setLocationInputText] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [initialLocationDetermined, setInitialLocationDetermined] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(initialRadius);

  /**
   * Sets the default location (Madrid) when geolocation fails or is unavailable
   */
  const setDefaultLocation = useCallback(() => {
    setCurrentLocation(DEFAULT_LOCATION);
    setLocationInputText(DEFAULT_LOCATION.name);
    setIsLocationLoading(false);
    setInitialLocationDetermined(true);
  }, []);

  /**
   * Handles successful geolocation by setting the current location
   * @param {GeolocationPosition} position - Position object from browser geolocation API
   */
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

  /**
   * Handles geolocation errors by falling back to the default location
   */
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

  /**
   * Handles manual location search when user enters a location
   */
  const handleManualLocationSearch = useCallback(() => {
    if (!locationInputText.trim()) {
      setCurrentLocation(prev => ({...DEFAULT_LOCATION, radius: prev?.radius || selectedRadius }));
      setLocationInputText(DEFAULT_LOCATION.name);
      return;
    }
    
  }, [locationInputText, selectedRadius]);
  
  /**
   * Updates the search radius and updates the current location with the new radius
   * @param {number} newRadius - New radius value in meters
   */
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