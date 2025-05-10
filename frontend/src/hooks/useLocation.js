import { useState, useEffect, useCallback } from 'react';
import Radar from 'radar-sdk-js';

const RADAR_PUBLISHABLE_KEY = import.meta.env.VITE_RADAR_PUBLISHABLE_KEY || 'YOUR_RADAR_PUBLISHABLE_KEY_HERE';
export const DEFAULT_LOCATION = {
  name: 'Madrid',
  latitude: 40.416775,
  longitude: -3.703790,
  radius: 25000, // 25km default radius
  isGeolocated: false,
};

const useLocation = (initialRadius = DEFAULT_LOCATION.radius) => {
  const [locationInputText, setLocationInputText] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [sdkInitialized, setSdkInitialized] = useState(false);
  const [initialLocationDetermined, setInitialLocationDetermined] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(initialRadius);

  // Initialize Radar SDK
  useEffect(() => {
    if (RADAR_PUBLISHABLE_KEY && RADAR_PUBLISHABLE_KEY !== 'YOUR_RADAR_PUBLISHABLE_KEY_HERE') {
      try {
        Radar.initialize(RADAR_PUBLISHABLE_KEY);
        setSdkInitialized(true);
        console.log("useLocation.js: Radar SDK Initialized");
      } catch (initError) {
        console.error("useLocation.js: Error initializing Radar SDK:", initError);
        if (!initialLocationDetermined) {
          setCurrentLocation(DEFAULT_LOCATION);
          setLocationInputText(DEFAULT_LOCATION.name);
          setIsLocationLoading(false);
          setInitialLocationDetermined(true);
          console.log("useLocation.js: SDK init error, setting default location.");
        }
      }
    } else {
      console.warn("useLocation.js: Radar API Key not found. Location features will use default.");
      if (!initialLocationDetermined) {
        setCurrentLocation(DEFAULT_LOCATION);
        setLocationInputText(DEFAULT_LOCATION.name);
        setIsLocationLoading(false);
        setInitialLocationDetermined(true);
        console.log("useLocation.js: No API key, setting default location.");
      }
    }
  }, [initialLocationDetermined]);

  // Get initial location (browser or default)
  useEffect(() => {
    if (initialLocationDetermined) {
      console.log("useLocation.js: Location already determined, skipping geolocation.");
      return;
    }
    if (!sdkInitialized) {
      console.log("useLocation.js: SDK not ready for initial location yet.");
      return; 
    }
    
    console.log("useLocation.js: Starting initial geolocation.");
    setIsLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('useLocation.js: Browser geolocation success:', { latitude, longitude });
          Radar.reverseGeocode({ latitude, longitude })
            .then((result) => {
              if (result && result.addresses && result.addresses.length > 0) {
                const addr = result.addresses[0];
                const locationDisplayName = addr.city || addr.state || addr.county || 'Determined Location';
                setCurrentLocation({
                  name: locationDisplayName,
                  latitude,
                  longitude,
                  radius: selectedRadius, // Use state for radius
                  isGeolocated: true,
                });
                setLocationInputText(locationDisplayName);
              } else {
                const fallbackName = `Lat: ${latitude.toFixed(2)}, Lng: ${longitude.toFixed(2)}`;
                setCurrentLocation({
                  name: 'Vicinity (no address)', 
                  latitude,
                  longitude,
                  radius: selectedRadius,
                  isGeolocated: true,
                });
                setLocationInputText(fallbackName);
              }
            })
            .catch((err) => {
              console.warn('useLocation.js: Radar reverse geocode error:', err);
              const fallbackName = `Lat: ${latitude.toFixed(2)}, Lng: ${longitude.toFixed(2)}`;
              setCurrentLocation({
                name: 'Location (error)', 
                latitude,
                longitude,
                radius: selectedRadius,
                isGeolocated: true,
              });
              setLocationInputText(fallbackName);
            })
            .finally(() => {
              setIsLocationLoading(false);
              setInitialLocationDetermined(true);
              console.log("useLocation.js: Initial location determined (after reverse geocode).");
            });
        },
        (error) => {
          console.warn(`useLocation.js: Browser geolocation error: ${error.message}. Falling back to default.`);
          setCurrentLocation(DEFAULT_LOCATION);
          setLocationInputText(DEFAULT_LOCATION.name);
          setIsLocationLoading(false);
          setInitialLocationDetermined(true);
           console.log("useLocation.js: Initial location determined (geolocation error).");
        }
      );
    } else {
      console.warn('useLocation.js: Browser does not support geolocation. Falling back to default.');
      setCurrentLocation(DEFAULT_LOCATION);
      setLocationInputText(DEFAULT_LOCATION.name);
      setIsLocationLoading(false);
      setInitialLocationDetermined(true);
      console.log("useLocation.js: Initial location determined (geolocation not supported).");
    }
  }, [sdkInitialized, initialLocationDetermined, selectedRadius]);

  const handleManualLocationSearch = useCallback(() => {
    if (!sdkInitialized || !locationInputText || locationInputText.startsWith('Lat:')) {
        if (!locationInputText || locationInputText === DEFAULT_LOCATION.name) return;
        if (locationInputText.startsWith('Lat:') && currentLocation && currentLocation.isGeolocated) return;
    }
    if (!locationInputText.trim()) {
        setCurrentLocation(prev => ({...DEFAULT_LOCATION, radius: prev?.radius || selectedRadius }));
        setLocationInputText(DEFAULT_LOCATION.name);
        return;
    }
    
    console.log("useLocation.js: Manual location search (Spain) for:", locationInputText);
    setIsLocationLoading(true);

    Radar.forwardGeocode({ query: locationInputText, country: 'ES' })
      .then((resultSpain) => {
        if (resultSpain && resultSpain.addresses && resultSpain.addresses.length > 0) {
          const addr = resultSpain.addresses[0];
          const newLocationName = addr.formattedAddress || addr.city || addr.state || 'Searched Location (ES)';
          setCurrentLocation({
            name: newLocationName,
            latitude: addr.latitude,
            longitude: addr.longitude,
            radius: selectedRadius,
            isGeolocated: false,
          });
          // setLocationInputText(newLocationName); // Optional: update input text to formatted address
          setIsLocationLoading(false);
        } else {
          console.log("useLocation.js: No results from Spain, trying general search for:", locationInputText);
          Radar.forwardGeocode({ query: locationInputText })
            .then((resultGeneral) => {
              if (resultGeneral && resultGeneral.addresses && resultGeneral.addresses.length > 0) {
                const addr = resultGeneral.addresses[0];
                const newLocationName = addr.formattedAddress || addr.city || addr.state || 'Searched Location (General)';
                setCurrentLocation({
                  name: newLocationName,
                  latitude: addr.latitude,
                  longitude: addr.longitude,
                  radius: selectedRadius,
                  isGeolocated: false,
                });
                // setLocationInputText(newLocationName); // Optional
              } else {
                console.warn('useLocation.js: No results for manual location search (General):', locationInputText);
                // Optionally, indicate to the user that the location was not found
              }
            })
            .catch((errGeneral) => {
              console.error('useLocation.js: Manual Radar.forwardGeocode (General) error:', errGeneral);
            })
            .finally(() => {
              setIsLocationLoading(false);
            });
        }
      })
      .catch((errSpain) => {
        console.error('useLocation.js: Manual Radar.forwardGeocode (Spain) error:', errSpain);
        setIsLocationLoading(false);
      });
  }, [sdkInitialized, locationInputText, currentLocation, selectedRadius]);
  
  const updateRadius = (newRadius) => {
    setSelectedRadius(newRadius);
    if (currentLocation) {
        setCurrentLocation(prevLoc => ({ ...prevLoc, radius: newRadius }));
    }
  };

  return {
    currentLocation,
    locationInputText,
    setLocationInputText,
    isLocationLoading,
    handleManualLocationSearch,
    initialLocationDetermined,
    DEFAULT_LOCATION, // Exporting for use in Home.jsx if needed for initial state
    selectedRadius,
    setSelectedRadius: updateRadius, // Use the wrapper to also update currentLocation
  };
};

export default useLocation; 