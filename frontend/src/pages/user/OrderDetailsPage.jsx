import { useState } from 'react';
import { useParams, Link } from 'react-router';
import AlertMessage from '../../components/common/AlertMessage.jsx';
import LoadingFallback from '../../components/common/LoadingFallback.jsx';
import useRestaurantArticles from '../../features/restaurant/hooks/useRestaurantArticles';
import useOrderDetails from '../../features/user/hooks/useOrderDetails';
import { IoRefresh } from 'react-icons/io5';
const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const [wasUpdated, setWasUpdated] = useState(false);
  
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

  const getArticleDetails = (articleIdToFind) => {
    return articles.find(article => article.id === articleIdToFind);
  };

  if (orderLoading) return <LoadingFallback />;
  if (orderError && !order) return <AlertMessage type="error" message={orderError} />;
  if (!order) return <AlertMessage type="info" message="Order not found." />;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Details</h1>
        <button
          onClick={handleRefresh}
          className="btn btn-outline btn-sm gap-2"
          aria-label="Refresh order details"
        >
          <IoRefresh className="h-4 w-4" /> Refresh
        </button>
      </div>
      
      {wasUpdated && (
        <AlertMessage
          type="success"
          message="Order information updated!"
          className="mb-4 transition-opacity duration-500"
        />
      )}
      
      {orderError && order && <AlertMessage type="warning" message={`There was an issue loading order details: ${orderError}`} className="mb-4" />}
      {articlesError && <AlertMessage type="warning" message={`Could not load full article information: ${articlesError}`} className="mb-4" />}

      <div className={`bg-base-100 shadow-xl rounded-lg p-6 mb-6 ${wasUpdated ? 'border-2 border-success transition-all duration-700' : ''}`}>
        <h2 className="text-xl font-semibold mb-3">Order #{order.id}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Status:</p>
            <p className="text-lg font-medium badge badge-lg 
              {order.status === 'pending' ? 'badge-warning' : 
               order.status === 'preparing' ? 'badge-info' : 
               order.status === 'delivered' ? 'badge-success' : 
               order.status === 'cancelled' ? 'badge-error' : 'badge-ghost'}
            ">
              {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Order Date:</p>
            <p className="text-lg">{new Date(order.created_at).toLocaleString()}</p>
          </div>
          {order.restaurant && (
            <div>
              <p className="text-sm text-gray-600">Restaurant:</p>
              <p className="text-lg font-medium">
                <Link to={`/restaurants/${order.restaurant.id}/articles`} className="link link-hover text-secondary">
                    {order.restaurant.name || `Restaurant ID: ${order.restaurant.id}`}
                </Link>
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">Total Price:</p>
            <p className="text-lg font-bold text-primary">€{parseFloat(order.total_price).toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-base-100 shadow-xl rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Items Ordered</h3>
        {articlesLoading && order?.items?.length > 0 && <p className="text-sm text-gray-500">Loading article details...</p>}
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
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  {articleDetail && (
                    <p className="text-md font-medium">
                      Current price: €{(parseFloat(articleDetail.price) * item.quantity).toFixed(2)}
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
        <Link to="/user/orders" className="btn btn-outline btn-primary">Back to My Orders</Link>
      </div>
    </div>
  );
};

export default OrderDetailsPage;

