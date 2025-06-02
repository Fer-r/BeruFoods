import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import InfiniteScrollContainer from '../../components/common/InfiniteScrollContainer';
import RestaurantArticleCard from '../../features/restaurant/components/RestaurantArticleCard';
import ArticleCsvImportModal from '../../features/restaurant/components/ArticleCsvImportModal';
import useRestaurantOwnedArticles from '../../features/restaurant/hooks/useRestaurantOwnedArticles';
import LoadingFallback from '../../components/common/LoadingFallback';
import articleService from '../../features/restaurant/services/articleService';

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
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-base-content">Manage Your Articles</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowImportModal(true)}
            className="btn btn-outline btn-primary w-full sm:w-auto"
          >
            Import from CSV
          </button>
          <Link to={PATHS.RESTAURANT_ARTICLES_NEW} className="btn btn-primary w-full sm:w-auto">
            Add New Article
          </Link>
        </div>
      </div>

      {message && (
        <div className={`alert ${error ? 'alert-error' : 'alert-success'} shadow-lg mb-4`}>
          <div>
            <span>{message}</span>
          </div>
        </div>
      )}

      {error && !initialLoading && <p className="text-center text-error py-6">Error fetching articles: {error}</p>}

      {initialLoading && !error && <LoadingFallback message="Loading your articles..." />}

      {!initialLoading && !error && articles.length === 0 && !hasMoreArticles && (
        <div className="text-center py-10 bg-base-200 rounded-lg shadow">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-base-content opacity-30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <p className="text-xl text-base-content mb-4">You haven&apos;t added any articles yet.</p>
          <p className="text-sm text-base-content opacity-70 mb-6">Start by adding your delicious offerings to the menu.</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button 
              onClick={() => setShowImportModal(true)}
              className="btn btn-outline btn-accent"
            >
              Import from CSV
            </button>
            <Link to={PATHS.RESTAURANT_ARTICLES_NEW} className="btn btn-accent">
              Add Your First Article
            </Link>
          </div>
        </div>
      )}

      {/* Only show InfiniteScrollContainer if not initial loading, no error, or if there are articles/more to load */}
      {(!initialLoading || articles.length > 0) && !error && (articles.length > 0 || hasMoreArticles) && (
        <InfiniteScrollContainer
          data={articles}
          fetchMoreData={fetchMoreArticles}
          hasMore={hasMoreArticles}
          renderItem={renderArticleItem}
          loader={<div className="text-center col-span-full py-4"><span className="loading loading-dots loading-md"></span></div>}
          endMessage={
            articles.length > 0 && !hasMoreArticles ? (
              <p className="text-center col-span-full py-4 text-base-content opacity-75">
                <b>You&apos;ve seen all your articles.</b>
              </p>
            ) : null
          }
          isLoadingMore={loading && articles.length > 0} // Show loader for "load more" only when articles are already present
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        />
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