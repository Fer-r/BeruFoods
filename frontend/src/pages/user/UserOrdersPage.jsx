import InfiniteScrollContainer from '../../components/common/InfiniteScrollContainer';
import useUserOrders from '../../features/user/hooks/useUserOrders';
import OrderListItem from '../../features/user/components/OrderListItem';
import LoadingFallback from '../../components/common/LoadingFallback';
import AlertMessage from '../../components/common/AlertMessage';
import { IoRefresh } from 'react-icons/io5';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';


const UserOrdersPage = () => {
  const { entity } = useAuth();
  const { mercureError } = useNotifications();
  const {
    orders,
    loading,
    initialLoading,
    error,
    hasMore,
    fetchMoreOrders,
    refreshOrders
  } = useUserOrders();

  const renderOrderItem = (order) => (
    <OrderListItem
      key={order.id}
      order={order}
    />
  );

  if (initialLoading && orders.length === 0) {
    return (
      <div className="container mx-auto p-4 py-10 text-center">
        <LoadingFallback message="Loading your orders..." />
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="container mx-auto p-4">
         <h1 className="text-3xl font-bold mb-6 text-center">My Orders</h1>
        <AlertMessage type="error" message={`${error}`} />
        {mercureError && (
          <AlertMessage type="warning\" message={`Real-time updates unavailable: ${mercureError}`} className="mt-2" />
        )}
      </div>
    );
  }
  
  if (!initialLoading && !error && orders.length === 0 && !hasMore) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        <div className="bg-base-100 p-8 rounded-lg shadow-lg max-w-md mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-base-content opacity-30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <p className="text-xl text-base-content mb-4">You haven't placed any orders yet.</p>
          <p className="text-sm text-base-content/70 mb-6">Explore our restaurants and place your first order!</p>
          <a href="/" className="btn btn-primary">Browse Restaurants</a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-base-content">My Orders</h1>
        <button
          onClick={refreshOrders}
          className="btn btn-outline btn-sm gap-2 shadow-sm"
          aria-label="Refresh orders"
          data-testid="refresh-orders-button"
        >
          <IoRefresh className="h-4 w-4" /> Refresh
        </button>
      </div>
      
      {mercureError && (
        <AlertMessage type="warning" message={`Real-time updates unavailable: ${mercureError}`} className="mb-6" />
      )}
      
      {error && orders.length > 0 && (
        <AlertMessage type="warning\" message={`Error loading more orders: ${error}`} className="mb-6" />
      )}

      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-base-200/50 to-base-100/50 rounded-lg -z-10"></div>
        <div className="p-4">
          <InfiniteScrollContainer
            data={orders}
            fetchMoreData={fetchMoreOrders}
            hasMore={hasMore}
            renderItem={renderOrderItem}
            loader={<div className="text-center py-4"><LoadingFallback small text="Loading more orders..."/></div>}
            endMessage={
              orders.length > 0 && !hasMore ? (
                <div className="text-center py-6 text-base-content/70">
                  <p className="font-medium">You've seen all your orders</p>
                </div>
              ) : null
            }
            isLoadingMore={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default UserOrdersPage;