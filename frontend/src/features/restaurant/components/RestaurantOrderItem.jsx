import { useState } from 'react';
import { Link } from 'react-router';
import OrderStatusSelector from './OrderStatusSelector';

const RestaurantOrderItem = ({ order, onStatusUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'badge-warning';
      case 'preparing':
        return 'badge-info';
      case 'delivered':
        return 'badge-success';
      case 'cancelled':
        return 'badge-error';
      default:
        return 'badge-neutral';
    }
  };

  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleStatusUpdate = async (newStatus) => {
    setIsUpdating(true);
    try {
      await onStatusUpdate(order.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const calculateItemsTotal = () => {
    if (!order.items || !Array.isArray(order.items)) return 0;
    return order.items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <div className="card bg-base-100 shadow-md mb-4">
      <div className="card-body">
        {/* Order Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">Order #{order.id}</h3>
            <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
          </div>
          <div className="text-right">
            <div className={`badge ${getStatusBadgeClass(order.status)} text-white font-medium`}>
              {formatStatus(order.status)}
            </div>
            <p className="text-lg font-bold mt-1">${order.total_price}</p>
          </div>
        </div>

        {/* Customer Info */}
        {order.user && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-1">Customer</h4>
            <p className="text-sm">{order.user.name}</p>
            {order.user.email && (
              <p className="text-xs text-gray-500">{order.user.email}</p>
            )}
          </div>
        )}

        {/* Order Items */}
        {order.items && order.items.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">
              Items ({calculateItemsTotal()} total)
            </h4>
            <div className="space-y-1">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.articleName || `Article ID: ${item.articleId}`}
                  </span>
                  {item.price && (
                    <span className="text-gray-600">
                      ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="border-t pt-4 flex justify-between items-start">
          <OrderStatusSelector
            currentStatus={order.status}
            onStatusChange={handleStatusUpdate}
            isUpdating={isUpdating}
          />
          <Link 
            to={`/restaurant/orders/${order.id}`}
            className="btn btn-outline btn-primary btn-sm"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RestaurantOrderItem; 