import InfiniteScrollContainer from '../../components/common/InfiniteScrollContainer';
import useUserOrders from '../../features/user/hooks/useUserOrders';
import OrderListItem from '../../features/user/components/OrderListItem';
import LoadingFallback from '../../components/common/LoadingFallback';
import AlertMessage from '../../components/common/AlertMessage';

const UserOrdersPage = () => {
  const { 
    orders, 
    loading, 
    initialLoading, 
    error, 
    hasMore, 
    fetchMoreOrders,
    // refreshOrders // Available if you want to add a manual refresh button
  } = useUserOrders();

  const renderOrderItem = (order) => (
    <OrderListItem key={order.id} order={order} />
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
      </div>
    );
  }
  
  if (!initialLoading && !error && orders.length === 0 && !hasMore) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        <div className="bg-base-100 p-8 rounded-lg shadow">
          <p className="text-xl text-gray-500">You haven&apos;t placed any orders yet.</p>
          {/* Optional: Link to browse restaurants */}
          {/* <Link to="/" className="btn btn-primary mt-4">Browse Restaurants</Link> */}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">My Orders</h1>
      
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
        isLoadingMore={loading} // Pass the subsequent loading state
      />
    </div>
  );
};

export default UserOrdersPage; 