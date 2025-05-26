import { useState } from 'react';
import { MdAccessTime, MdRestaurantMenu, MdCheckCircle, MdCancel } from 'react-icons/md';
import InfiniteScrollContainer from '../../components/common/InfiniteScrollContainer';
import useRestaurantOrders from '../../features/restaurant/hooks/useRestaurantOrders';
import RestaurantOrderItem from '../../features/restaurant/components/RestaurantOrderItem';
import DateFilter from '../../features/restaurant/components/DateFilter';
import LoadingFallback from '../../components/common/LoadingFallback';
import AlertMessage from '../../components/common/AlertMessage';

const RestaurantOrdersPage = () => {
  const { 
    orders, 
    loading, 
    initialLoading, 
    error, 
    hasMore, 
    fetchMoreOrders,
    updateOrderStatus,
    filterOrdersByStatus,
    filterOrdersByDate,
    statusFilter,
    dateFilter
  } = useRestaurantOrders();

  const [updateError, setUpdateError] = useState(null);

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdateError(null);
    const result = await updateOrderStatus(orderId, newStatus);
    
    if (!result.success) {
      setUpdateError(`Failed to update order #${orderId}: ${result.error}`);
      // Auto-clear error after 5 seconds
      setTimeout(() => setUpdateError(null), 5000);
    }
  };

  const renderOrderItem = (order) => (
    <RestaurantOrderItem 
      key={order.id} 
      order={order} 
      onStatusUpdate={handleStatusUpdate}
    />
  );

  const getOrderCountsByStatus = () => {
    const counts = {
      all: orders.length,
      pending: 0,
      preparing: 0,
      delivered: 0,
      cancelled: 0
    };

    orders.forEach(order => {
      if (order.status in counts) {
        counts[order.status]++;
      }
    });

    return counts;
  };

  const orderCounts = getOrderCountsByStatus();

  if (initialLoading && orders.length === 0) {
    return (
      <div className="container mx-auto p-4 py-10 text-center">
        <LoadingFallback message="Loading orders..." />
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Restaurant Orders</h1>
        <AlertMessage type="error" message={`${error}`} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-center">Restaurant Orders</h1>
        
        {/* Filters */}
        <div className="bg-base-200 p-4 rounded-lg mb-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center justify-center">
            {/* Status Filter */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
              <div className="flex flex-wrap justify-center gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => filterOrdersByStatus(option.value)}
                    className={`btn btn-sm ${
                      statusFilter === option.value 
                        ? 'btn-primary' 
                        : 'btn-outline btn-primary'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Filter */}
            <DateFilter 
              dateFilter={dateFilter} 
              onDateFilterChange={filterOrdersByDate} 
            />
          </div>
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="stat bg-warning text-warning-content rounded-lg">
            <div className="stat-figure">
              <MdAccessTime className="text-warning-content text-3xl" />
            </div>
            <div className="stat-title text-warning-content">Pending</div>
            <div className="stat-value text-warning-content">{orderCounts.pending}</div>
          </div>
          
          <div className="stat bg-info text-info-content rounded-lg">
            <div className="stat-figure">
              <MdRestaurantMenu className="text-info-content text-3xl" />
            </div>
            <div className="stat-title text-info-content">Preparing</div>
            <div className="stat-value text-info-content">{orderCounts.preparing}</div>
          </div>
          
          <div className="stat bg-success text-success-content rounded-lg">
            <div className="stat-figure">
              <MdCheckCircle className="text-success-content text-3xl" />
            </div>
            <div className="stat-title text-success-content">Delivered</div>
            <div className="stat-value text-success-content">{orderCounts.delivered}</div>
          </div>
          
          <div className="stat bg-error text-error-content rounded-lg">
            <div className="stat-figure">
              <MdCancel className="text-error-content text-3xl" />
            </div>
            <div className="stat-title text-error-content">Cancelled</div>
            <div className="stat-value text-error-content">{orderCounts.cancelled}</div>
          </div>
        </div>
      </div>

      {/* Update Error Alert */}
      {updateError && (
        <AlertMessage type="error" message={updateError} className="mb-4" />
      )}

      {/* General Error Alert */}
      {error && orders.length > 0 && (
        <AlertMessage type="warning" message={`Error loading more orders: ${error}`} className="mb-4" />
      )}

      {/* Orders List */}
      {!initialLoading && !error && orders.length === 0 && !hasMore ? (
        <div className="text-center">
          <div className="bg-base-100 p-8 rounded-lg shadow">
            <p className="text-xl text-gray-500 mb-2">
              {statusFilter === 'all' 
                ? "No orders found." 
                : `No ${statusFilter} orders found.`
              }
            </p>
            {statusFilter !== 'all' && (
              <button 
                onClick={() => filterOrdersByStatus('all')}
                className="btn btn-primary btn-sm mt-2"
              >
                Show All Orders
              </button>
            )}
          </div>
        </div>
      ) : (
        <InfiniteScrollContainer
          data={orders}
          fetchMoreData={fetchMoreOrders}
          hasMore={hasMore}
          renderItem={renderOrderItem}
          loader={<div className="text-center py-4"><LoadingFallback small text="Loading more orders..."/></div>}
          endMessage={
            orders.length > 0 && !hasMore ? (
              <p className="text-center py-6 text-gray-500">
                <b>You&apos;ve seen all orders.</b>
              </p>
            ) : null
          }
          isLoadingMore={loading}
        />
      )}
    </div>
  );
};

export default RestaurantOrdersPage; 