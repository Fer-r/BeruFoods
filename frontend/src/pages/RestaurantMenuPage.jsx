import { useParams } from "react-router";
import InfiniteScrollContainer from "../components/InfiniteScrollContainer";
import useRestaurantDetails from '../hooks/useRestaurantDetails';
import useRestaurantArticles from '../hooks/useRestaurantArticles';
import ArticleCard from '../components/ArticleCard';


// Helper component to display restaurant details
const RestaurantDetailsDisplay = ({ restaurant }) => (
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
          <p className="bg-base-100 p-3 rounded-md mb-4 text-lg leading-relaxed">{restaurant.description}</p>
        )}
        {restaurant.address && (
          <p className="text-sm text-base-content opacity-75 mb-1">
            {restaurant.address.address_line}, {restaurant.address.city}, {restaurant.address.postal_code}, {restaurant.address.province}
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
);

// Helper component to display restaurant articles menu
const RestaurantArticlesDisplay = ({
  articles,
  fetchMoreArticles,
  hasMoreArticles,
  articlesLoading, // Loading state for "load more"
  articlesError,
  initialLoadingArticles, // Initial loading state for articles
  renderArticleItem,
}) => {
  if (articlesError) {
    return <p className="text-center text-error py-6">Error fetching articles: {articlesError}</p>;
  }

  if (!articlesError && articles.length === 0 && !hasMoreArticles && !initialLoadingArticles) {
    return <p className="text-center py-10 text-base-content">This restaurant has no articles yet.</p>;
  }

  // Only show InfiniteScrollContainer if there's no error or if there are already articles (even if an error occurs later)
  // and also if it's not the initial empty state without errors.
  if ((!articlesError || articles.length > 0) && (articles.length > 0 || hasMoreArticles || initialLoadingArticles)) {
    return (
      <InfiniteScrollContainer
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
        data={articles}
        fetchMoreData={fetchMoreArticles}
        hasMore={hasMoreArticles}
        renderItem={renderArticleItem}
        loader={<p className="text-center py-4">Loading more articles...</p>}
        endMessage={
          articles.length > 0 ? (
            <p className="text-center py-4 text-base-content opacity-75">
              <b>You&apos;ve seen all the articles!</b>
            </p>
          ) : null
        }
        // Show loader for "load more" only when articles are already present
        isLoadingMore={articlesLoading && articles.length > 0}
      />
    );
  }
  return null; // Fallback if no other condition is met (should ideally be covered)
};

const RestaurantMenuPage = () => {
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
    loading: articlesLoading, // This is true for initial load AND subsequent loads
    error: articlesError,
    initialLoading: articlesInitialLoading, // This is true only for the very first article load
  } = useRestaurantArticles(restaurantId);

  const renderArticle = (article) => (
    <ArticleCard key={article.id} article={article} restaurantId={restaurantId} />
  );

  // Combined loading state for initial page render (restaurant details OR initial articles)
  if (restaurantLoading || articlesInitialLoading) {
    return <p className="text-center py-10 text-xl font-semibold">Loading restaurant details and menu...</p>;
  }

  // Handle error for restaurant details first
  if (restaurantError) {
    return <p className="text-center text-error py-10 text-lg">Error fetching restaurant details: {restaurantError}</p>;
  }

  // If restaurant details loaded but restaurant is null (e.g., not found)
  if (!restaurant) {
    return <p className="text-center text-warning py-10 text-lg">Restaurant not found.</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <RestaurantDetailsDisplay restaurant={restaurant} />

      <h2 className="text-3xl font-bold mb-8 text-center text-base-content">Menu</h2>

      <RestaurantArticlesDisplay
        articles={articles}
        fetchMoreArticles={fetchMoreArticles}
        hasMoreArticles={hasMoreArticles}
        articlesLoading={articlesLoading}
        articlesError={articlesError}
        initialLoadingArticles={articlesInitialLoading}
        renderArticleItem={renderArticle}
      />
    </div>
  );
};

export default RestaurantMenuPage; 