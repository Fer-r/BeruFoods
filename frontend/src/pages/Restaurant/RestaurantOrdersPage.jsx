import { useState, useEffect, useCallback } from 'react';
import { fetchDataFromEndpoint } from '../../services/useApiService';
import AlertMessage from '../../components/AlertMessage';
import { useAuth } from '../../context/AuthContext';
import LoadingFallback from '../../components/LoadingFallback';

const RestaurantOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchOrders = useCallback(async () => {
    console.log('[RestaurantOrdersPage] User object in fetchOrders:', JSON.stringify(user, null, 2));

    if (!user || !user.roles || !user.roles.includes('ROLE_RESTAURANT') || !user.restaurantId) {
      console.error('[RestaurantOrdersPage] Validation failed:', {
        hasUser: !!user,
        hasRoles: !!(user && user.roles),
        isRestaurantRole: !!(user && user.roles && user.roles.includes('ROLE_RESTAURANT')),
        hasRestaurantId: !!(user && user.restaurantId),
        restaurantIdValue: user ? user.restaurantId : undefined
      });
      setError("No restaurant logged in, invalid role, or restaurant ID missing. Check console for details.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const responseData = await fetchDataFromEndpoint(`/api/orders?restaurant=${user.restaurantId}&order[createdAt]=desc`, 'GET', null, true);
      setOrders(responseData['hydra:member'] || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.details?.['hydra:title'] || err.message || 'Failed to fetch orders.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    console.log('[RestaurantOrdersPage] User object in handleUpdateStatus:', JSON.stringify(user, null, 2));
    if (!user || !user.roles || !user.roles.includes('ROLE_RESTAURANT') || !user.restaurantId) {
      alert("Action not allowed: No restaurant logged in or invalid permissions. Check console for details.");
      console.error('[RestaurantOrdersPage] Update status validation failed:', {
        hasUser: !!user,
        hasRoles: !!(user && user.roles),
        isRestaurantRole: !!(user && user.roles && user.roles.includes('ROLE_RESTAURANT')),
        hasRestaurantId: !!(user && user.restaurantId),
        restaurantIdValue: user ? user.restaurantId : undefined
      });
      return;
    }
    try {
      const updatedOrder = await fetchDataFromEndpoint(`/api/orders/${orderId}`, 'PATCH', { status: newStatus }, true);
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: updatedOrder.status } : order
        )
      );
    } catch (err) {
      console.error(`Error updating order ${orderId} to status ${newStatus}:`, err);
      alert(`Failed to update order status: ${err.details?.['hydra:title'] || err.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-200 text-yellow-800';
      case 'preparing':
        return 'bg-blue-200 text-blue-800';
      case 'delivered':
        return 'bg-green-200 text-green-800';
      case 'cancelled':
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const getNextActions = (currentStatus) => {
    const actions = [];
    if (currentStatus === 'pending') {
      actions.push({ label: 'Mark as Preparing', newStatus: 'preparing', className: 'btn-primary btn-sm' });
      actions.push({ label: 'Cancel Order', newStatus: 'cancelled', className: 'btn-error btn-sm ml-2' });
    } else if (currentStatus === 'preparing') {
      actions.push({ label: 'Mark as Delivered', newStatus: 'delivered', className: 'btn-success btn-sm' });
      actions.push({ label: 'Cancel Order', newStatus: 'cancelled', className: 'btn-error btn-sm ml-2' });
    }
    return actions;
  };


  if (isLoading) {
    return <LoadingFallback />;
  }

  if (error) {
    return <AlertMessage message={error} type="error" />;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Orders</h1>
        <button className="btn btn-ghost" onClick={fetchOrders} disabled={isLoading}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500">No orders found for your restaurant yet.</p>
          <img src="/images/empty-box.svg" alt="No orders" className="mx-auto mt-4 w-1/3" /> {/* Example image */}
        </div>
      ) : (
        <div className="overflow-x-auto shadow-lg rounded-lg">
          <table className="table w-full">
            <thead className="bg-base-200">
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Items</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="hover">
                  <td className="font-semibold">#{order.id}</td>
                  <td>{order.user?.email || 'N/A'}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}</td>
                  <td>${parseFloat(order.total_price).toFixed(2)}</td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="text-sm">
                    {order.items && order.items.length > 0 ? (
                      <ul>
                        {order.items.slice(0, 2).map((item, index) => ( // Show first 2 items as preview
                          <li key={index}>{item.quantity}x {item.name}</li>
                        ))}
                        {order.items.length > 2 && <li>...and {order.items.length - 2} more</li>}
                      </ul>
                    ) : 'No items'}
                  </td>
                  <td>
                    {getNextActions(order.status).map(action => (
                      <button
                        key={action.newStatus}
                        className={`btn ${action.className}`}
                        onClick={() => handleUpdateStatus(order.id, action.newStatus)}
                      >
                        {action.label}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RestaurantOrdersPage; 