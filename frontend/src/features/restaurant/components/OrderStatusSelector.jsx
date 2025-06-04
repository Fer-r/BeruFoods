import { useState } from 'react';

/**
 * OrderStatusSelector provides UI controls for restaurant owners to update the status of an order.
 * It displays buttons for allowed status transitions based on the current order status,
 * and includes a confirmation dialog for cancellation actions.
 * 
 * @param {Object} props - Component props
 * @param {string} props.currentStatus - The current status of the order
 * @param {Function} props.onStatusChange - Callback function when status is changed
 * @param {boolean} props.isUpdating - Whether a status update is currently in progress
 * @returns {JSX.Element} The rendered order status selector component
 */
const OrderStatusSelector = ({ currentStatus, onStatusChange, isUpdating }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);

  // Define allowed status transitions based on backend logic
  const allowedTransitions = {
    'pending': ['preparing', 'cancelled'],
    'preparing': ['ready', 'cancelled'],
    'ready': ['completed', 'cancelled'],
    'completed': [], // No further transitions
    'cancelled': [] // No further transitions
  };

  const statusLabels = {
    'pending': 'Pending',
    'preparing': 'Preparing',
    'ready': 'Ready',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };

  const statusColors = {
    'pending': 'btn-warning',
    'preparing': 'btn-info',
    'ready': 'btn-accent',
    'completed': 'btn-success',
    'cancelled': 'btn-error'
  };

  const availableTransitions = allowedTransitions[currentStatus] || [];

  const handleStatusClick = (newStatus) => {
    // If it's cancellation, show confirmation
    if (newStatus === 'cancelled') {
      setPendingStatus(newStatus);
      setShowConfirmation(true);
    } else {
      onStatusChange(newStatus);
    }
  };

  const handleConfirmCancel = () => {
    onStatusChange(pendingStatus);
    setShowConfirmation(false);
    setPendingStatus(null);
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setPendingStatus(null);
  };

  if (availableTransitions.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Status:</span>
        <div className={`badge ${currentStatus === 'completed' ? 'badge-success' : 'badge-error'} text-white`}>
          {statusLabels[currentStatus]}
        </div>
        <span className="text-xs text-gray-400">
          {currentStatus === 'completed' ? '(Order completed)' : '(Order cancelled)'}
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 font-medium">Update Status:</span>
          <div className={`badge ${currentStatus === 'pending' ? 'badge-warning' : currentStatus === 'ready' ? 'badge-accent' : 'badge-info'} text-white`}>
            {statusLabels[currentStatus]}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {availableTransitions.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusClick(status)}
              disabled={isUpdating}
              className={`btn btn-sm ${statusColors[status]} text-white ${isUpdating ? 'loading' : ''}`}
            >
              {isUpdating ? '' : `Mark as ${statusLabels[status]}`}
            </button>
          ))}
        </div>
      </div>

      {/* Confirmation Modal for Cancellation */}
      {showConfirmation && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Cancellation</h3>
            <p className="py-4">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            <div className="modal-action">
              <button 
                className="btn btn-error text-white"
                onClick={handleConfirmCancel}
                disabled={isUpdating}
              >
                {isUpdating ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
              <button 
                className="btn btn-outline"
                onClick={handleCancelConfirmation}
                disabled={isUpdating}
              >
                Keep Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderStatusSelector;