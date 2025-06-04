import { useState, useEffect, useRef } from 'react';
import useRestaurants from '../../features/restaurant/hooks/useRestaurants';
import useFoodTypes from '../../features/restaurant/hooks/useFoodTypes';
import useGoogleLocation, { DEFAULT_LOCATION } from '../../hooks/useGoogleLocation';
import { useAuth } from '../../context/AuthContext.jsx';
import FilterControls from '../../features/restaurant/components/FilterControls';
import CuisineFilter from '../../features/restaurant/components/CuisineFilter';
import RestaurantList from '../../features/restaurant/components/RestaurantList';


const Home = () => {
  const [selectedFoodTypeIds, setSelectedFoodTypeIds] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const searchInputRef = useRef(null);
  const prevIsLoadingRestaurantsRef = useRef();

  // Get authentication state and user data
  const { isAuthenticated, entity } = useAuth();
  
  // State for managing location (either from user token or geolocation)
  const [finalLocation, setFinalLocation] = useState(null);
  const [finalLocationText, setFinalLocationText] = useState('');
  const [isLocationReady, setIsLocationReady] = useState(false);

  const {
    currentLocation,
    locationInputText,
    isLocationLoading,
    initialLocationDetermined,
    selectedRadius,
    setSelectedRadius,
  } = useGoogleLocation(DEFAULT_LOCATION.radius);

  const [isOpenNow, setIsOpenNow] = useState(false);

  const radiusOptions = [
    { label: '1 km', value: 1000 },
    { label: '5 km', value: 5000 },
    { label: '10 km', value: 10000 },
    { label: '25 km', value: 25000 },
    { label: '50 km', value: 50000 },
  ];

  // Effect to handle location logic based on authentication status
  useEffect(() => {
    const handleLocationSetup = () => {
      if (isAuthenticated() && entity?.address) {
        // User is logged in and has address data in token
        const userAddress = entity.address;
        
        if (userAddress.latitude && userAddress.longitude) {
          const userLocation = {
            name: userAddress.city || 'Your Location',
            latitude: parseFloat(userAddress.latitude),
            longitude: parseFloat(userAddress.longitude),
            radius: selectedRadius,
            isGeolocated: false, // From user token, not browser geolocation
          };
          
          setFinalLocation(userLocation);
          setFinalLocationText(userAddress.city || 'Your Location');
          setIsLocationReady(true);
          
          return;
        }
      }
      
      // Not logged in or no address data - use geolocation hook
      if (initialLocationDetermined && currentLocation) {
        setFinalLocation(currentLocation);
        setFinalLocationText(currentLocation.name || locationInputText || 'Madrid');
        setIsLocationReady(true);
        
      }
    };

    handleLocationSetup();
  }, [isAuthenticated, entity, initialLocationDetermined, currentLocation, locationInputText, selectedRadius]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchText]);

  const filters = {
    foodTypeId: selectedFoodTypeIds.length > 0 ? selectedFoodTypeIds.join(',') : undefined,
    name: debouncedSearchText || undefined,
    latitude: isLocationReady && finalLocation ? finalLocation.latitude : undefined,
    longitude: isLocationReady && finalLocation ? finalLocation.longitude : undefined,
    radius: isLocationReady && finalLocation ? selectedRadius : undefined,
    isOpenNow: isOpenNow,
  };

  const { 
    restaurants, 
    isLoadingInitial: isLoadingRestaurants, 
    isLoadingMore, 
    error, 
    hasMore,
    loadMoreRestaurants,
  } = useRestaurants(filters, 10, isLocationReady);

  const { foodTypes: cuisineOptions, isLoading: isLoadingCuisines, error: errorCuisines } = useFoodTypes();

  useEffect(() => {
    if (prevIsLoadingRestaurantsRef.current === true && !isLoadingRestaurants) {
      if (debouncedSearchText && searchInputRef.current) {
        if (document.activeElement !== searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    }
    prevIsLoadingRestaurantsRef.current = isLoadingRestaurants;
  }, [isLoadingRestaurants, debouncedSearchText]);

  const handleCuisineFilter = (foodTypeId) => {
    setSelectedFoodTypeIds(prevIds => 
      prevIds.includes(foodTypeId) ? prevIds.filter(id => id !== foodTypeId) : [...prevIds, foodTypeId]
    );
  };

  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };

  const handleLocationSelect = (addressDetails) => {
    if (!addressDetails.lat || !addressDetails.lng) {
      console.warn('Invalid location data received');
      return;
    }

    const newLocation = {
      name: addressDetails.addressLine || addressDetails.fullAddress || 'Selected Location',
      latitude: parseFloat(addressDetails.lat),
      longitude: parseFloat(addressDetails.lng),
      radius: selectedRadius,
      isGeolocated: false,
      fullAddress: addressDetails.fullAddress,
      addressLine: addressDetails.addressLine,
      city: addressDetails.city,
    };

    setFinalLocation(newLocation);
    setFinalLocationText(newLocation.name);
    setIsLocationReady(true);
    
  };
  
  const showDeterminingLocation = !isLocationReady && (isLocationLoading || !finalLocation);

  if (showDeterminingLocation) { 
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
            <p className="text-xl font-medium">Determining your location...</p>
            <p className="text-sm text-base-content/70 mt-2">We're finding the best restaurants near you</p>
          </div>
        </div>
      );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg -z-10"></div>
        <div className="p-6">
          <FilterControls
            searchText={searchText}
            onSearchChange={handleSearchChange}
            searchInputRef={searchInputRef}
            locationInputText={finalLocationText || locationInputText || 'Madrid'}
            onLocationSelect={handleLocationSelect}
            isOpenNow={isOpenNow}
            onIsOpenNowChange={setIsOpenNow}
            selectedRadius={selectedRadius}
            onRadiusChange={setSelectedRadius}
            radiusOptions={radiusOptions}
          />
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-accent/5 rounded-lg -z-10"></div>
        <div className="p-6">
          <CuisineFilter
            cuisineOptions={cuisineOptions}
            selectedFoodTypeIds={selectedFoodTypeIds}
            onCuisineFilterChange={handleCuisineFilter}
            isLoadingCuisines={isLoadingCuisines}
            errorCuisines={errorCuisines}
          />
        </div>
      </div>

      {error && restaurants.length > 0 && (
         <p className="text-center text-sm text-error py-2">Error loading more: {error}</p>
      )}
      
      <RestaurantList
        restaurants={restaurants}
        isLoadingRestaurants={isLoadingRestaurants}
        isLoadingMore={isLoadingMore}
        error={error}
        hasMore={hasMore}
        loadMoreRestaurants={loadMoreRestaurants}
        debouncedSearchText={debouncedSearchText}
        currentLocationName={finalLocation?.name || currentLocation?.name}
        isLocationLoading={!isLocationReady}
      />
    </div>
  );
};

export default Home;