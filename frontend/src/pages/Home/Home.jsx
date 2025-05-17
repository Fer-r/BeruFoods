import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import useRestaurants from '../../hooks/useRestaurants';
import useFoodTypes from '../../hooks/useFoodTypes';
import useLocation, { DEFAULT_LOCATION } from '../../hooks/useLocation';
import FilterControls from '../../components/FilterControls';
import CuisineFilter from '../../components/CuisineFilter';
import RestaurantList from '../../components/RestaurantList';

// Component for logged-in regular users (placeholder)
const UserHomeContent = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome, User!</h1>
      <p>This is your personalized home page content.</p>
      {/* Add user-specific components here */}
    </div>
  );
};

// Component for public/anonymous users (existing Home logic)
const PublicHomeContent = () => {
  const [selectedFoodTypeIds, setSelectedFoodTypeIds] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const searchInputRef = useRef(null);
  const prevIsLoadingRestaurantsRef = useRef();

  const {
    currentLocation,
    locationInputText,
    setLocationInputText,
    isLocationLoading,
    handleManualLocationSearch,
    initialLocationDetermined,
    selectedRadius,
    setSelectedRadius,
  } = useLocation(DEFAULT_LOCATION.radius);

  const [isOpenNow, setIsOpenNow] = useState(false);

  const radiusOptions = [
    { label: '1 km', value: 1000 },
    { label: '5 km', value: 5000 },
    { label: '10 km', value: 10000 },
    { label: '25 km', value: 25000 },
    { label: '50 km', value: 50000 },
  ];

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchText]);

  const filters = {
    foodTypeId: selectedFoodTypeIds.length > 0 ? selectedFoodTypeIds.join(',') : undefined,
    name: debouncedSearchText || undefined,
    latitude: initialLocationDetermined && currentLocation ? currentLocation.latitude : undefined,
    longitude: initialLocationDetermined && currentLocation ? currentLocation.longitude : undefined,
    radius: initialLocationDetermined && currentLocation ? selectedRadius : undefined,
    isOpenNow: isOpenNow,
  };

  const { 
    restaurants, 
    isLoadingInitial: isLoadingRestaurants, 
    isLoadingMore, 
    error, 
    hasMore,
    loadMoreRestaurants,
  } = useRestaurants(filters, 10, initialLocationDetermined);

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

  const handleLocationInputChange = (event) => {
    setLocationInputText(event.target.value);
  };
  
  const showDeterminingLocation = isLocationLoading && !currentLocation;

  if (showDeterminingLocation) { 
      return <p className="text-center text-lg py-10">Determining your location...</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <FilterControls
        searchText={searchText}
        onSearchChange={handleSearchChange}
        searchInputRef={searchInputRef}
        locationInputText={locationInputText}
        onLocationInputChange={handleLocationInputChange}
        onLocationSearch={handleManualLocationSearch}
        isOpenNow={isOpenNow}
        onIsOpenNowChange={setIsOpenNow}
        selectedRadius={selectedRadius}
        onRadiusChange={setSelectedRadius}
        radiusOptions={radiusOptions}
      />

      <CuisineFilter
        cuisineOptions={cuisineOptions}
        selectedFoodTypeIds={selectedFoodTypeIds}
        onCuisineFilterChange={handleCuisineFilter}
        isLoadingCuisines={isLoadingCuisines}
        errorCuisines={errorCuisines}
      />

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
        currentLocationName={currentLocation?.name}
        isLocationLoading={isLocationLoading}
      />
    </div>
  );
};

// Main Home component that decides what to render or redirect
const Home = () => {
  const { isAuthenticated, entity } = useAuth();

  if (isAuthenticated() && entity?.roles) {
    const isRestaurant = entity.roles.includes('ROLE_RESTAURANT');
    const isUser = entity.roles.includes('ROLE_USER');

    if (isRestaurant) {
      return <Navigate to="/restaurant/dashboard" replace />;
    }
    if (isUser && !isRestaurant) { 
      return <UserHomeContent />;
    }
  }

  return <PublicHomeContent />;
};

export default Home;
