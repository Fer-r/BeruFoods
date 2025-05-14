import { useParams } from 'react-router';
import InfiniteScrollContainer from '../../components/InfiniteScrollContainer';
import useRestaurantArticles from '../../hooks/useRestaurantArticles';
import ArticleCard from '../../components/ArticleCard';
import useRestaurantDetails from '../../hooks/useRestaurantDetails'; // Import the new hook

const RestaurantArticlesPage = () => {
  const { restaurantId } = useParams();
  
  const {
    restaurant,
    loading: restaurantLoading,
    error: restaurantError,
  } = useRestaurantDetails(restaurantId);

  const {
    articles,
    fetchMoreArticles,
    hasMoreArticles,
    loading: articlesLoading,
    error: articlesError,
    initialLoading: articlesInitialLoading,
  } = useRestaurantArticles(restaurantId);

  const renderArticle = (article) => (
    <ArticleCard key={article.id} article={article} />
  );

  // Combined loading state for initial page render
  if (restaurantLoading || articlesInitialLoading) {
    return <p className="text-center py-10">Loading restaurant details and menu...</p>;
  }

  // Handle error for restaurant details first
  if (restaurantError) {
    return <p className="text-center text-error py-10">Error fetching restaurant details: {restaurantError}</p>;
  }

  // If restaurant details loaded but restaurant is null (e.g., not found)
  if (!restaurant) {
    return <p className="text-center text-warning py-10">Restaurant not found.</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Restaurant Details Section */}
      <div className="mb-12 p-4 md:p-6 bg-base-300 shadow-lg rounded-lg">
        <div className="flex flex-col md:flex-row items-center">
          {restaurant.imageUrl && (
            <img 
              src={restaurant.imageUrl} 
              alt={restaurant.name} 
              className="w-full md:w-1/3 h-64 object-cover rounded-lg mb-6 md:mb-0 md:mr-8 shadow-md"
            />
          )}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-bold mb-3 text-base-content">{restaurant.name}</h1>
            {restaurant.description && (
              <p className="bg-base-100 mb-4 text-lg leading-relaxed">{restaurant.description}</p>
            )}
            {/* You can add more restaurant details here if available and needed, e.g., address, opening hours from restaurant object */}
            {restaurant.address && (
              <p className="text-sm text-base-content opacity-75 mb-1">
                {restaurant.address.address_line}, {restaurant.address.province}
              </p>
            )}
            {restaurant.openingTime && restaurant.closingTime && (
                <p className="text-sm text-base-content opacity-75">
                    Open: {restaurant.openingTime} - {restaurant.closingTime}
                </p>
            )}
          </div>
        </div>
      </div>

      {/* Articles Menu Section */}
      <h2 className="text-3xl font-bold mb-8 text-center text-base-content">Menu</h2>
      
      {articlesError && (
        <p className="text-center text-error py-6">Error fetching articles: {articlesError}</p>
      )}

      {!articlesError && articles.length === 0 && !hasMoreArticles && !articlesInitialLoading && (
        <p className="text-center py-10">This restaurant has no articles yet.</p>
      )}

      {(!articlesError || articles.length > 0) && (
        <InfiniteScrollContainer
          data={articles}
          fetchMoreData={fetchMoreArticles}
          hasMore={hasMoreArticles}
          renderItem={renderArticle}
          loader={<p className="text-center py-4">Loading more articles...</p>}
          endMessage={
            articles.length > 0 ? (
              <p className="text-center py-4 text-base-content opacity-75">
                <b>You&apos;ve seen all the articles!</b>
              </p>
            ) : null // Don't show end message if there were no articles to begin with
          }
          isLoadingMore={articlesLoading && articles.length > 0}
        />
      )}
    </div>
  );
};

export default RestaurantArticlesPage; 