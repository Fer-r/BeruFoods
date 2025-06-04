import { Link } from 'react-router';
import { useState, useEffect } from 'react';

/**
 * OrderStatusBadge displays a colored badge indicating the order status.
 * 
 * @param {Object} props - Component props
 * @param {string} props.status - The order status to display
 * @returns {JSX.Element} The rendered status badge
 */
const OrderStatusBadge = ({ status }) => {
  let badgeClass = 'badge-ghost';
  let text = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A';

  switch (status?.toLowerCase()) {
    case 'pending':
    case 'pendiente':
      badgeClass = 'badge-warning';
      text = 'Pending';
      break;
    case 'preparing':
    case 'preparando':
      badgeClass = 'badge-info';
      text = 'Preparing';
      break;
    case 'delivered':
    case 'entregado':
      badgeClass = 'badge-success';
      text = 'Delivered';
      break;
    case 'cancelled':
    case 'cancelado':
      badgeClass = 'badge-error';
      text = 'Cancelled';
      break;
    default:
      break;
  }
  return <span className={`badge badge-lg ${badgeClass} text-white font-medium`}>{text}</span>;
};

/**
 * OrderListItem displays an order in the user's order history.
 * It shows order details including ID, date, status, restaurant name, and total price.
 * The component highlights itself when the order status changes and provides a link to view details.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.order - The order data to display
 * @param {number} props.order.id - Unique identifier for the order
 * @param {string} props.order.created_at - Creation date/time of the order
 * @param {string} props.order.status - Current status of the order
 * @param {string|number} props.order.total_price - Total price of the order
 * @param {Object} [props.order.restaurant] - Optional restaurant information
 * @returns {JSX.Element|null} The rendered order item or null if order is invalid
 */
const OrderListItem = ({ order }) => {
  const [highlight, setHighlight] = useState(false);
  const [previousStatus, setPreviousStatus] = useState(order?.status);
  
  useEffect(() => {
    if (!order) return;
    
    if (previousStatus && previousStatus !== order.status) {
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 3000);
      return () => clearTimeout(timer);
    }
    
    setPreviousStatus(order.status);
  }, [order?.status, previousStatus, order?.id]);
  
  if (!order) {
    return null;
  }

  return (
    <div
      className={`card order-card ${highlight ? 'bg-primary bg-opacity-20 border-2 border-primary' : 'bg-base-100'} shadow-md hover:shadow-lg transition-all duration-500 ease-in-out mb-4 w-full`}
    >
      <div className="card-body p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
          <h2 className="card-title text-lg md:text-xl mb-2 sm:mb-0">
            Order #{order.id}
            {highlight && (
              <span className="badge badge-accent badge-sm ml-2 animate-pulse">Updated!</span>
            )}
          </h2>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 text-sm mb-4">
          <div>
            <p className="font-semibold text-gray-600">Restaurant:</p>
            <p className="text-base-content truncate">{order.restaurant?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-600">Order Date:</p>
            <p className="text-base-content">{new Date(order.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-600">Total Price:</p>
            <p className="font-bold text-primary text-base-content">€{parseFloat(order.total_price).toFixed(2)}</p>
          </div>
        </div>
        
        <div className="card-actions justify-end mt-2">
          <Link 
            to={`/user/orders/${order.id}`}
            className="btn btn-sm btn-primary"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderListItem;