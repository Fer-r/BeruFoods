import { useState } from 'react';
import { useParams, Link } from 'react-router';
import AlertMessage from '../../components/common/AlertMessage.jsx';
import LoadingFallback from '../../components/common/LoadingFallback.jsx';

import useRestaurantOrderDetails from '../../features/restaurant/hooks/useRestaurantOrderDetails';
import OrderStatusSelector from '../../features/restaurant/components/OrderStatusSelector';
import { downloadOrderBill } from '../../utils/pdfGenerator';
import { IoRefresh, IoDownload } from 'react-icons/io5';
import { MdPerson, MdEmail, MdPhone } from 'react-icons/md';

const RestaurantOrderDetailsPage = () => {
  const { orderId } = useParams();
  const [wasUpdated, setWasUpdated] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  
  // Use our custom hook for restaurant order details with real-time update support
  const {
    order,
    orderWithArticleDetails,
    loading: orderLoading,
    error: orderError,
    refreshOrder,
    updateOrderStatus
  } = useRestaurantOrderDetails(orderId);

  // Use the enhanced order data if available, fallback to basic order
  const displayOrder = orderWithArticleDetails || order;

  // When order is updated via real-time notification, show visual feedback
  const handleRefresh = () => {
    refreshOrder();
    setWasUpdated(true);
    
    // Clear the "updated" visual feedback after 2 seconds
    setTimeout(() => {
      setWasUpdated(false);
    }, 2000);
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdateError(null);
    const result = await updateOrderStatus(newStatus);
    
    if (result.success) {
      setWasUpdated(true);
      setTimeout(() => {
        setWasUpdated(false);
      }, 2000);
    } else {
      setUpdateError(`Failed to update order status: ${result.error}`);
      setTimeout(() => setUpdateError(null), 5000);
    }
  };

  const handleDownloadBill = async () => {
    if (!displayOrder) return;
    
    setPdfGenerating(true);
    try {
      const result = downloadOrderBill(displayOrder, true);
      if (result.success) {
        setWasUpdated(true);
        setTimeout(() => setWasUpdated(false), 2000);
      } else {
        setUpdateError(`Failed to generate PDF: ${result.error}`);
        setTimeout(() => setUpdateError(null), 5000);
      }
    } catch (error) {
      setUpdateError(`Error creating PDF: ${error.message}`);
      setTimeout(() => setUpdateError(null), 5000);
    } finally {
      setPdfGenerating(false);
    }
  };

  if (orderLoading) return <LoadingFallback />;
  if (orderError && !displayOrder) return <AlertMessage type="error" message={orderError} />;
  if (!displayOrder) return <AlertMessage type="info" message="Order not found." />;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadBill}
            disabled={pdfGenerating}
            className="btn btn-primary btn-sm gap-2"
            aria-label="Download order bill as PDF"
          >
            <IoDownload className="h-4 w-4" /> 
            {pdfGenerating ? 'Generating...' : 'Download Bill'}
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

      {updateError && (
        <AlertMessage type="error\" message={updateError} className="mb-4" />
      )}
      
      {orderError && displayOrder && <AlertMessage type="warning\" message={`There was an issue loading order details: ${orderError}`} className="mb-4" />}

      {/* Order Information Card */}
      <div className={`bg-base-100 shadow-xl rounded-lg p-6 mb-6 ${wasUpdated ? 'border-2 border-success transition-all duration-700' : ''}`}>
        <h2 className="text-xl font-semibold mb-4">Order #{displayOrder.id}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Status:</p>
            <div className={`badge badge-lg text-white font-medium ${
              displayOrder.status === 'pending' ? 'badge-warning' : 
              displayOrder.status === 'preparing' ? 'badge-info' : 
              displayOrder.status === 'ready' ? 'badge-accent' : 
              displayOrder.status === 'completed' ? 'badge-success' : 
              displayOrder.status === 'cancelled' ? 'badge-error' : 'badge-ghost'
            }`}>
              {displayOrder.status === 'pending' ? 'Pendiente' :
               displayOrder.status === 'preparing' ? 'Preparando' :
               displayOrder.status === 'ready' ? 'Listo para recoger' :
               displayOrder.status === 'completed' ? 'Completado' :
               displayOrder.status === 'cancelled' ? 'Cancelado' : 'N/A'}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">Order Date:</p>
            <p className="text-lg">{new Date(displayOrder.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Price:</p>
            <p className="text-lg font-bold text-primary">{parseFloat(displayOrder.total_price).toFixed(2)}€</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Items:</p>
            <p className="text-lg">{displayOrder.totalItems || displayOrder.items?.reduce((total, item) => total + item.quantity, 0) || 0}</p>
          </div>
        </div>

        {/* Order Status Management */}
        <div className="border-t pt-4">
          <OrderStatusSelector
            currentStatus={displayOrder.status}
            onStatusChange={handleStatusUpdate}
            isUpdating={false}
          />
        </div>
      </div>

      {/* Customer Information Card */}
      {displayOrder.user && (
        <div className="bg-base-100 shadow-xl rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MdPerson className="text-primary" />
            Customer Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name:</p>
              <p className="text-lg">{displayOrder.user.name || 'N/A'}</p>
            </div>
            {displayOrder.user.email && (
              <div className="flex items-center gap-2">
                <MdEmail className="text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Email:</p>
                  <p className="text-lg">{displayOrder.user.email}</p>
                </div>
              </div>
            )}
            {displayOrder.user.phone && (
              <div className="flex items-center gap-2">
                <MdPhone className="text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Phone:</p>
                  <p className="text-lg">{displayOrder.user.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Items Card */}
      <div className="bg-base-100 shadow-xl rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Items Ordered</h3>
        {displayOrder.items && displayOrder.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {displayOrder.items.map((item, index) => {
                  // Use enhanced item data if available, fallback to basic data
                  const itemName = item.articleName || `Article ID: ${item.articleId}`;
                  const unitPrice = item.articlePrice || 0;
                  const lineTotal = item.lineTotal || (unitPrice * item.quantity);
                  
                  return (
                    <tr key={index} className="hover">
                      <td>
                        <div>
                          <p className="font-semibold">{itemName}</p>
                          {item.articleDescription && (
                            <p className="text-sm text-gray-500 mt-1">{item.articleDescription}</p>
                          )}
                          {!item.articleDetail && item.articleId && (
                            <p className="text-xs text-warning mt-1">
                              Article details not available (ID: {item.articleId})
                            </p>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-outline">{item.quantity}</span>
                      </td>
                      <td>
                        {unitPrice > 0 ? (
                          <span className="font-medium">{parseFloat(unitPrice).toFixed(2)}€</span>
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </td>
                      <td>
                        {lineTotal > 0 ? (
                          <span className="font-bold text-primary">{lineTotal.toFixed(2)}€</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2">
                  <td colSpan="3" className="font-bold text-right">Order Total:</td>
                  <td className="font-bold text-primary text-lg">{parseFloat(displayOrder.total_price).toFixed(2)}€</td>
                </tr>
                {displayOrder.calculatedTotal && Math.abs(displayOrder.calculatedTotal - parseFloat(displayOrder.total_price)) > 0.01 && (
                  <tr className="border-t">
                    <td colSpan="3" className="text-sm text-gray-500 text-right">Calculated Total:</td>
                    <td className="text-sm text-gray-500">{displayOrder.calculatedTotal.toFixed(2)}€</td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>
        ) : (
          <p>No items found in this order.</p>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link to="/restaurant/orders" className="btn btn-outline btn-primary">Back to Orders</Link>
      </div>
    </div>
  );
};

export default RestaurantOrderDetailsPage;