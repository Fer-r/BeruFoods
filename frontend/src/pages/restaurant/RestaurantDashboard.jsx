// import React from 'react';
import { Link } from 'react-router'; // Added for Quick Action buttons
import { useMemo } from 'react';
import { FaPlusSquare, FaEye, FaBell, FaUtensils, FaExclamationTriangle, FaClipboardList } from 'react-icons/fa'; // Added icons
import { useNotifications } from '../../context/NotificationContext';
import useRestaurantOrders from '../../features/restaurant/hooks/useRestaurantOrders';

import useRestaurantOwnedArticles from '../../features/restaurant/hooks/useRestaurantOwnedArticles';
import { ROUTES } from '../../utils/constants';

/**
 * @component RestaurantDashboard
 * Provides an overview and control panel for restaurant users.
 * It displays recent notifications, quick action buttons (e.g., add menu item, view orders),
 * a summary of recent orders, and statistics about their menu items (e.g., available/unavailable).
 *
 * This component utilizes several hooks:
 * - `useNotifications` context hook to get notification data.
 * - `useRestaurantOrders` custom hook to fetch and manage restaurant orders.
 * - `useRestaurantOwnedArticles` custom hook to fetch and manage restaurant's menu articles.
 *
 * It uses `useMemo` to derive and memoize:
 * - `recentOrders`: A list of the 5 most recent orders.
 * - `recentNotifications`: A list of the 5 most recent persistent notifications.
 * - `articleStats`: Statistics about menu articles, including total, available, and unavailable counts.
 *
 * Key functionalities include:
 * - Displaying alerts for unavailable menu items.
 * - Listing recent notifications with unread count.
 * - Providing quick links to common restaurant management pages.
 * - Showing a list of recent orders with options to view details or update status.
 * - Displaying menu item statistics.
 *
 * @returns {JSX.Element} The rendered restaurant dashboard page.
 */
const RestaurantDashboard = () => {
  const { persistentNotifications, unreadCount } = useNotifications();
  
  // Get restaurant data using real hooks
  const { orders, loading: ordersLoading, updateOrderStatus } = useRestaurantOrders(20);
  const { articles, loading: articlesLoading } = useRestaurantOwnedArticles();

  // Get recent orders (last 5)
  const recentOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [orders]);

  // Get recent notifications (last 5)
  const recentNotifications = useMemo(() => {
    return persistentNotifications.slice(0, 5);
  }, [persistentNotifications]);

  // Article statistics
  const articleStats = useMemo(() => {
    if (!articles) return { total: 0, available: 0, unavailable: 0 };
    
    const available = articles.filter(article => article.available).length;
    return {
      total: articles.length,
      available,
      unavailable: articles.length - available
    };
  }, [articles]);

  /**
   * Handles the update of an order's status.
   * This function is called when a restaurant user attempts to change the status of an order
   * (e.g., from 'pending' to 'confirmed').
   * It uses the `updateOrderStatus` function from the `useRestaurantOrders` hook to make the API call.
   *
   * @async
   * @param {string|number} orderId - The ID of the order to be updated.
   * @param {string} newStatus - The new status to set for the order (e.g., "confirmed", "preparing").
   */
  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (!result.success) {
      // Handle error - you might want to show a toast notification
      console.error('Failed to update order status:', result.error);
    }
  };

  /**
   * Determines the appropriate CSS badge class based on the order status string.
   * This is used to visually differentiate order statuses in the UI.
   *
   * @param {string} status - The order status string (e.g., "pending", "confirmed").
   * @returns {string} The corresponding DaisyUI badge CSS class (e.g., "badge-warning", "badge-info").
   *                   Returns "badge-neutral" for unknown statuses.
   */
  const getStatusBadgeClass = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'pending': return 'badge-warning';
      case 'confirmed': return 'badge-info';
      case 'preparing': return 'badge-primary';
      case 'ready': return 'badge-accent';
      case 'delivered': return 'badge-success';
      case 'cancelled': return 'badge-error';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className="p-6 bg-base-200 min-h-screen">
      {/* Alerts and Warnings */}
      {articleStats.unavailable > 0 && (
        <div className="alert alert-warning mb-6 shadow-md">
          <FaExclamationTriangle className="flex-shrink-0" />
          <span>You have {articleStats.unavailable} unavailable menu items. Consider updating your menu.</span>
          <Link to={ROUTES.RESTAURANT.ARTICLES} className="btn btn-sm btn-outline">
            Manage Menu
          </Link>
        </div>
      )}

      {/* Notifications Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-base-content flex items-center">
            <FaBell className="mr-3 text-primary" /> 
            Recent Notifications
            {unreadCount > 0 && (
              <span className="badge badge-error badge-sm ml-2">{unreadCount}</span>
            )}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recentNotifications.length > 0 ? (
            recentNotifications.map(notification => (
              <div key={notification.id} className={`card bg-base-100 shadow-md p-4 ${!notification.isRead ? 'border-l-4 border-accent' : ''}`}>
                <p className="text-sm text-base-content">{notification.message}</p>
                <p className="text-xs text-base-content/60 mt-1">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <div className="card bg-base-100 shadow-md p-6 md:col-span-2">
              <div className="flex flex-col items-center justify-center text-center">
                <FaBell className="text-3xl text-base-content/30 mb-2" />
                <p className="text-base-content">No recent notifications.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      

      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-base-content">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link to={ROUTES.RESTAURANT.ARTICLES_NEW} className="btn btn-primary h-auto py-4 flex flex-col items-center justify-center shadow-md">
            <FaPlusSquare className="text-2xl mb-2" /> 
            <span>Add Menu Item</span>
          </Link>
          <Link to={ROUTES.RESTAURANT.ORDERS} className="btn btn-secondary h-auto py-4 flex flex-col items-center justify-center shadow-md">
            <FaEye className="text-2xl mb-2" /> 
            <span>View All Orders</span>
          </Link>
          <Link to={ROUTES.RESTAURANT.ARTICLES} className="btn btn-accent h-auto py-4 flex flex-col items-center justify-center shadow-md">
            <FaUtensils className="text-2xl mb-2" /> 
            <span>Manage Menu</span>
          </Link>
          <Link to={ROUTES.RESTAURANT.PROFILE} className="btn btn-info h-auto py-4 flex flex-col items-center justify-center shadow-md">
            <FaEye className="text-2xl mb-2" /> 
            <span>Restaurant Profile</span>
          </Link>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Latest Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-base-content flex items-center">
              <FaClipboardList className="mr-3 text-info" /> Recent Orders
            </h2>
            <Link to={ROUTES.RESTAURANT.ORDERS} className="btn btn-sm btn-outline btn-primary">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="card bg-base-100 shadow-md p-6 flex justify-center items-center">
                <span className="loading loading-spinner loading-md text-primary"></span>
                <p className="ml-2">Loading orders...</p>
              </div>
            ) : recentOrders.length > 0 ? (
              recentOrders.map(order => (
                <div key={order.id} className="card bg-base-100 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-base-content">
                          Order #{order.id}
                        </p>
                        {order.user && (
                          <p className="text-sm text-base-content/70">{order.user.name || order.user.email}</p>
                        )}
                        <p className="text-sm text-base-content/70">
                          {order.items?.length || 0} items - €{parseFloat(order.total_price || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-base-content/50">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="card-actions justify-end mt-2">
                      <Link to={ROUTES.RESTAURANT.ORDER_DETAILS_DYNAMIC(order.id)} className="btn btn-xs btn-outline btn-primary">
                        View Details
                      </Link>
                      {order.status?.toLowerCase() === 'pending' && (
                        <button 
                          className="btn btn-xs btn-success"
                          onClick={() => handleOrderStatusUpdate(order.id, 'preparing')}
                        >
                          Start Preparing
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card bg-base-100 shadow-md p-6 flex flex-col items-center justify-center text-center">
                <FaClipboardList className="text-3xl text-base-content/30 mb-2" />
                <p className="text-base-content">No recent orders.</p>
                <p className="text-sm text-base-content/70 mt-1">New orders will appear here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Menu Items Status */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-base-content flex items-center">
              <FaUtensils className="mr-3 text-success" /> Menu Status
            </h2>
            <Link to={ROUTES.RESTAURANT.ARTICLES} className="btn btn-sm btn-outline btn-secondary">
              Manage Menu
            </Link>
          </div>
          <div className="space-y-4">
            {articlesLoading ? (
              <div className="card bg-base-100 shadow-md p-6 flex justify-center items-center">
                <span className="loading loading-spinner loading-md text-primary"></span>
                <p className="ml-2">Loading menu data...</p>
              </div>
            ) : (
              <>
                <div className="card bg-base-100 shadow-md p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold text-base-content">Available Items</p>
                      <p className="text-3xl font-bold text-success">{articleStats.available}</p>
                    </div>
                    <div className="bg-success/10 p-4 rounded-full">
                      <FaUtensils className="text-4xl text-success" />
                    </div>
                  </div>
                </div>
                {articleStats.unavailable > 0 && (
                  <div className="card bg-base-100 shadow-md p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-lg font-semibold text-base-content">Unavailable Items</p>
                        <p className="text-3xl font-bold text-warning">{articleStats.unavailable}</p>
                      </div>
                      <div className="bg-warning/10 p-4 rounded-full">
                        <FaExclamationTriangle className="text-4xl text-warning" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link to={ROUTES.RESTAURANT.ARTICLES} className="btn btn-sm btn-warning">
                        Update Availability
                      </Link>
                    </div>
                  </div>
                )}
                <div className="card bg-base-100 shadow-md p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold text-base-content">Total Menu Items</p>
                      <p className="text-3xl font-bold text-primary">{articleStats.total}</p>
                    </div>
                    <div className="bg-primary/10 p-4 rounded-full">
                      <FaClipboardList className="text-4xl text-primary" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link to={ROUTES.RESTAURANT.ARTICLES_NEW} className="btn btn-sm btn-primary">
                      Add New Item
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default RestaurantDashboard;