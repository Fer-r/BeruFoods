import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import InfiniteScrollContainer from '../../components/common/InfiniteScrollContainer';
import RestaurantArticleCard from '../../features/restaurant/components/RestaurantArticleCard';
import ArticleCsvImportModal from '../../features/restaurant/components/ArticleCsvImportModal';
import useRestaurantOwnedArticles from '../../features/restaurant/hooks/useRestaurantOwnedArticles';
import LoadingFallback from '../../components/common/LoadingFallback';
import articleService from '../../features/restaurant/services/articleService';
import { FaCheckCircle, FaExclamationCircle, FaFileAlt } from 'react-icons/fa';

// TODO: Later, import PATHS from router or a constants file if it's extracted
const PATHS = {
    RESTAURANT_ARTICLES_NEW: "/restaurant/articles/new",
};

const RestaurantArticlesManagementPage = () => {
  const location = useLocation();
  const [message, setMessage] = useState(location.state?.message || null);
  const [showImportModal, setShowImportModal] = useState(false);

  const {
    articles,
    loading,
    initialLoading,
    error,
    fetchMoreArticles,
    hasMoreArticles,
    refreshArticles,
  } = useRestaurantOwnedArticles();

  // Clear message after a delay
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
        // Optional: Clear location state to prevent message re-appearing on refresh if desired
        // navigate(location.pathname, { replace: true, state: {} }); 
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleDeleteArticle = async (articleId) => {
    if (!window.confirm("Are you sure you want to delete this article? This action cannot be undone.")) {
        return;
    }
    try {
      await articleService.deleteArticle(articleId);
      setMessage('Article deleted successfully.');
      refreshArticles(); // Refresh the list
    } catch (err) {
      console.error('Failed to delete article:', err.response || err);
      setMessage(err.response?.data?.message || err.message || 'Failed to delete article. Please try again.');
    }
  };

  const handleImportSuccess = (message, isError) => {
    setMessage(message);
    if (!isError) {
      refreshArticles();
      setShowImportModal(false);
    }
  };

  const renderArticleItem = (article) => (
    <RestaurantArticleCard 
        key={article.id} 
        article={article} 
        onDelete={handleDeleteArticle} 
    />
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-base-content">Manage Your Menu</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setShowImportModal(true)}
            className="btn btn-outline btn-primary w-full sm:w-auto shadow-sm"
          >
            Import from CSV
          </button>
          <Link to={PATHS.RESTAURANT_ARTICLES_NEW} className="btn btn-primary w-full sm:w-auto shadow-sm">
            Add New Article
          </Link>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('error') || message.includes('fail') ? 'alert-error' : 'alert-success'} shadow-lg mb-6`}>
          <div className="flex items-center">
            {message.includes('error') || message.includes('fail') ? (
              <FaExclamationCircle className="h-6 w-6 flex-shrink-0" />
            ) : (
              <FaCheckCircle className="h-6 w-6 flex-shrink-0" />
            )}
            <span>{message}</span>
          </div>
        </div>
      )}

      {error && !initialLoading && (
        <div className="alert alert-error shadow-lg mb-6">
          <div className="flex items-center">
            <FaExclamationCircle className="h-6 w-6 flex-shrink-0" />
            <span>Error fetching articles: {error}</span>
          </div>
        </div>
      )}

      {initialLoading && !error && (
        <div className="flex justify-center items-center py-12">
          <LoadingFallback message="Loading your articles..." />
        </div>
      )}

      {!initialLoading && !error && articles.length === 0 && !hasMoreArticles && (
        <div className="text-center py-12 bg-base-200 rounded-lg shadow-md">
          <FaFileAlt className="h-16 w-16 text-base-content opacity-30 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-base-content mb-4">You haven&#39;t added any articles yet</h2>
          <p className="text-base-content/70 mb-8 max-w-md mx-auto">Start by adding your delicious offerings to the menu. Your customers are waiting to discover your amazing food!</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={() => setShowImportModal(true)}
              className="btn btn-outline btn-accent shadow-sm"
            >
              Import from CSV
            </button>
            <Link to={PATHS.RESTAURANT_ARTICLES_NEW} className="btn btn-accent shadow-sm">
              Add Your First Article
            </Link>
          </div>
        </div>
      )}

      {/* Only show InfiniteScrollContainer if not initial loading, no error, or if there are articles/more to load */}
      {(!initialLoading || articles.length > 0) && !error && (articles.length > 0 || hasMoreArticles) && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-base-200/30 to-base-100/30 rounded-lg -z-10"></div>
          <div className="p-4">
            <InfiniteScrollContainer
              data={articles}
              fetchMoreData={fetchMoreArticles}
              hasMore={hasMoreArticles}
              renderItem={renderArticleItem}
              loader={<div className="text-center col-span-full py-4"><span className="loading loading-dots loading-md"></span></div>}
              endMessage={
                articles.length > 0 && !hasMoreArticles ? (
                  <div className="text-center col-span-full py-6 text-base-content/70">
                    <p className="font-medium">You've seen all your articles</p>
                  </div>
                ) : null
              }
              isLoadingMore={loading && articles.length > 0} // Show loader for "load more" only when articles are already present
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            />
          </div>
        </div>
      )}

      <ArticleCsvImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default RestaurantArticlesManagementPage;