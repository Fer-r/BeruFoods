import InfiniteScrollContainer from '../../../components/common/InfiniteScrollContainer';
import RestaurantCard from './RestaurantCard'; // Import RestaurantCard

const RestaurantList = ({
  restaurants,
  isLoadingRestaurants,
  isLoadingMore,
  error,
  hasMore,
  loadMoreRestaurants,
  debouncedSearchText,
  currentLocationName,
  isLocationLoading, // Added to prevent showing "no restaurants" while location is loading
}) => {

  const renderRestaurantItem = (restaurant) => (
    <RestaurantCard key={restaurant.id} restaurant={restaurant} /> 
  );

  // This condition is important to avoid showing "No restaurants found" when location is still being determined.
  if (restaurants.length === 0 && !isLoadingRestaurants && !isLocationLoading && !error) {
    return (
      <p className='text-center text-lg py-10'>
        No restaurants found for &quot;{debouncedSearchText || 'All'}&quot; near &quot;{currentLocationName || 'selected area'}&quot;. Try adjusting your filters.
      </p>
    );
  }
  
  // Show loading message only if not determining location and no restaurants yet and no error
  if (isLoadingRestaurants && restaurants.length === 0 && !isLocationLoading && !error) {
      return <p className="text-center text-lg py-10">Loading restaurants for {currentLocationName || 'your area'}...</p>;
  }

  // Show error only if not determining location and no restaurants yet
  if (error && restaurants.length === 0 && !isLocationLoading) {
    return <p className="text-center text-lg text-error py-10">Error loading restaurants: {error}</p>;
  }

  // If there are restaurants OR there is more to load (hasMore is true), render the list.
  // This ensures the InfiniteScrollContainer is rendered even if the first page is empty but more pages exist.
  if (restaurants.length > 0 || hasMore) {
    return (
      <InfiniteScrollContainer
        data={restaurants} 
        fetchMoreData={loadMoreRestaurants}
        hasMore={hasMore}
        renderItem={renderRestaurantItem}
        layout="grid"
        gridItemClassName="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 p-2"
        loader={isLoadingMore ? <p className="text-center py-4 col-span-full">Loading more...</p> : <div /> }
        endMessage={<p className="text-center py-4 col-span-full"><b>You have seen it all!</b></p>}
        scrollThreshold="95%" 
        isLoadingMore={isLoadingMore} 
      />
    );
  }

  return null; // Fallback, should ideally be handled by above conditions
};

export default RestaurantList; 