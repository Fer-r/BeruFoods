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
          <AlertMessage type="warning" message={`Real-time updates unavailable: ${mercureError}`} className="mt-2" />
        )}
      </div>
    );
  }
  
  if (!initialLoading && !error && orders.length === 0 && !hasMore) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        <div className="bg-base-100 p-8 rounded-lg shadow">
          <p className="text-xl text-gray-500">You haven&apos;t placed any orders yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <button
          onClick={refreshOrders}
          className="btn btn-outline btn-sm gap-2"
          aria-label="Refresh orders"
          data-testid="refresh-orders-button"
        >
          <IoRefresh className="h-4 w-4" /> Refresh
        </button>
      </div>
      
      {mercureError && (
        <AlertMessage type="warning" message={`Real-time updates unavailable: ${mercureError}`} className="mb-4" />
      )}
      
      {error && orders.length > 0 && (
        <AlertMessage type="warning" message={`Error loading more orders: ${error}`} className="mb-4" />
      )}

      <InfiniteScrollContainer
        data={orders}
        fetchMoreData={fetchMoreOrders}
        hasMore={hasMore}
        renderItem={renderOrderItem}
        loader={<div className="text-center py-4"><LoadingFallback small text="Loading more orders..."/></div>}
        endMessage={
          orders.length > 0 && !hasMore ? (
            <p className="text-center py-6 text-gray-500">
              <b>You&apos;ve seen all your orders.</b>
            </p>
          ) : null
        }
        isLoadingMore={loading}
      />
    </div>
  );
};

export default UserOrdersPage; 