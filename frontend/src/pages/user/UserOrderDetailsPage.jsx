import { useState } from 'react';
import { useParams, Link } from 'react-router';
import AlertMessage from '../../components/common/AlertMessage.jsx';
import LoadingFallback from '../../components/common/LoadingFallback.jsx';
import useRestaurantArticles from '../../features/restaurant/hooks/useRestaurantArticles';
import useOrderDetails from '../../features/user/hooks/useOrderDetails';
import { downloadOrderBill } from '../../utils/pdfGenerator';
import { ROUTES } from '../../utils/constants';
import { IoRefresh, IoDownload } from 'react-icons/io5';

const UserOrderDetailsPage = () => {
  const { orderId } = useParams();
  const [wasUpdated, setWasUpdated] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  
  // Use our custom hook for order details with real-time update support
  const {
    order,
    loading: orderLoading,
    error: orderError,
    refreshOrder
  } = useOrderDetails(orderId);

  const restaurantIdForHook = order?.restaurant?.id;

  const {
    articles,
    loading: articlesLoading,
    error: articlesError
  } = useRestaurantArticles(restaurantIdForHook);
  
  // When order is updated via real-time notification, show visual feedback
  const handleRefresh = () => {
    refreshOrder();
    setWasUpdated(true);
    
    // Clear the "updated" visual feedback after 2 seconds
    setTimeout(() => {
      setWasUpdated(false);
    }, 2000);
  };

  const handleDownloadBill = async () => {
    if (!order) return;
    
    setPdfGenerating(true);
    setPdfError(null);
    try {
      // Create a modified order object with article details for better PDF generation
      const orderWithDetails = {
        ...order,
        items: order.items?.map(item => {
          const articleDetail = getArticleDetails(item.articleId);
          return {
            ...item,
            articleName: articleDetail?.name || `Article ID: ${item.articleId}`,
            articlePrice: articleDetail?.price || 0,
            articleDescription: articleDetail?.description,
            lineTotal: articleDetail ? parseFloat(articleDetail.price) * item.quantity : 0
          };
        }) || []
      };
      
      const result = downloadOrderBill(orderWithDetails, false);
      if (result.success) {
        setWasUpdated(true);
        setTimeout(() => setWasUpdated(false), 2000);
      } else {
        setPdfError(`Failed to generate PDF: ${result.error}`);
        setTimeout(() => setPdfError(null), 5000);
      }
    } catch (error) {
      setPdfError(`Error creating PDF: ${error.message}`);
      setTimeout(() => setPdfError(null), 5000);
    } finally {
      setPdfGenerating(false);
    }
  };

  const getArticleDetails = (articleIdToFind) => {
    return articles.find(article => article.id === articleIdToFind);
  };

  if (orderLoading) return <LoadingFallback />;
  if (orderError && !order) return <AlertMessage type="error" message={orderError} />;
  if (!order) return <AlertMessage type="info" message="Order not found." />;

  // Helper function to get status display text
  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Pending',
      'preparing': 'Preparing',
      'ready': 'Ready for Pickup',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  };

  // Helper function to get status badge class
  const getStatusBadgeClass = (status) => {
    const classMap = {
      'pending': 'badge-warning',
      'preparing': 'badge-info',
      'ready': 'badge-accent',
      'completed': 'badge-success',
      'cancelled': 'badge-error'
    };
    return classMap[status] || 'badge-ghost';
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Details</h1>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadBill}
            disabled={pdfGenerating}
            className="btn btn-primary btn-sm gap-2"
            aria-label="Download order receipt as PDF"
          >
            <IoDownload className="h-4 w-4" /> 
            {pdfGenerating ? 'Generating...' : 'Download Receipt'}
          </button>
          <button
            onClick={handleRefresh}
            className="btn btn-outline btn-sm gap-2"
            aria-label="Refresh order details"
          >
            <IoRefresh className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>
      
      {wasUpdated && (
        <AlertMessage
          type="success"
          message="Order information updated!"
          className="mb-4 transition-opacity duration-500"
        />
      )}
      
      {pdfError && (
        <AlertMessage type="error" message={pdfError} className="mb-4" />
      )}
      
      {orderError && order && <AlertMessage type="warning" message={`There was an issue loading order details: ${orderError}`} className="mb-4" />}
      {articlesError && <AlertMessage type="warning" message={`Could not load full article information: ${articlesError}`} className="mb-4" />}

      <div className={`bg-base-100 shadow-xl rounded-lg p-6 mb-6 ${wasUpdated ? 'border-2 border-success transition-all duration-700' : ''}`}>
        <h2 className="text-xl font-semibold mb-3">Order #{order.id}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-base-content/70">Status:</p>
            <p className={`text-lg font-medium badge badge-lg ${getStatusBadgeClass(order.status)}`}>
              {getStatusText(order.status)}
            </p>
            {order.status === 'ready' && (
              <p className="text-sm text-accent mt-2">
                Your order is ready for pickup at the restaurant!
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-base-content/70">Order Date:</p>
            <p className="text-lg">{new Date(order.created_at).toLocaleString()}</p>
          </div>
          {order.restaurant && (
            <div>
              <p className="text-sm text-base-content/70">Restaurant:</p>
              <p className="text-lg font-medium">
                <Link to={ROUTES.RESTAURANT_MENU.ARTICLES_DYNAMIC(order.restaurant.id)} className="link link-hover text-secondary">
                    {order.restaurant.name || `Restaurant ID: ${order.restaurant.id}`}
                </Link>
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-base-content/70">Total Price:</p>
            <p className="text-lg font-bold text-primary">{parseFloat(order.total_price).toFixed(2)}€</p>
          </div>
        </div>
      </div>

      <div className="bg-base-100 shadow-xl rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Items Ordered</h3>
        {articlesLoading && order?.items?.length > 0 && <p className="text-sm text-base-content/60">Loading article details...</p>}
        {order.items && order.items.length > 0 ? (
          <ul className="divide-y divide-base-300">
            {order.items.map((item, index) => {
              const articleDetail = getArticleDetails(item.articleId);
              return (
                <li key={index} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-lg">
                      {articleDetail ? articleDetail.name : `Article ID: ${item.articleId}`}
                    </p>
                    <p className="text-sm text-base-content/70">Quantity: {item.quantity}</p>
                  </div>
                  {articleDetail && (
                    <p className="text-md font-medium">
                      Current price: {(parseFloat(articleDetail.price) * item.quantity).toFixed(2)}€
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p>No items found in this order.</p>
        )}
      </div>

      <div className="mt-8 text-center">
                    <Link to={ROUTES.USER.ORDERS} className="btn btn-outline btn-primary">Back to My Orders</Link>
      </div>
    </div>
  );
};

export default UserOrderDetailsPage;