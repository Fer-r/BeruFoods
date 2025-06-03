// import React from 'react';
import { Link } from 'react-router'; // Added for Quick Action buttons
import { useMemo } from 'react';
import { FaPlusSquare, FaEye, FaBell, FaUtensils, FaExclamationTriangle, FaClipboardList } from 'react-icons/fa'; // Added icons
import { useNotifications } from '../../context/NotificationContext';
import useRestaurantOrders from '../../features/restaurant/hooks/useRestaurantOrders';

import useRestaurantOwnedArticles from '../../features/restaurant/hooks/useRestaurantOwnedArticles';

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

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (!result.success) {
      // Handle error - you might want to show a toast notification
      console.error('Failed to update order status:', result.error);
    }
  };

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
        <div className="alert alert-warning mb-6">
          <FaExclamationTriangle />
          <span>You have {articleStats.unavailable} unavailable menu items. Consider updating your menu.</span>
          <Link to="/restaurant/articles" className="btn btn-sm btn-outline">
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
          <Link to="/notifications" className="btn btn-sm btn-outline btn-primary">
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {recentNotifications.length > 0 ? (
            recentNotifications.map(notification => (
              <div key={notification.id} className={`card bg-base-100 shadow-md p-4 ${!notification.isRead ? 'border-l-4 border-accent' : ''}`}>
                <p className="text-sm text-base-content">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <div className="card bg-base-100 shadow-md p-4">
              <p className="text-base-content">No recent notifications.</p>
            </div>
          )}
        </div>
      </section>

      

      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-base-content">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/restaurant/articles/new" className="btn btn-primary">
            <FaPlusSquare className="mr-2" /> Add Menu Item
          </Link>
          <Link to="/restaurant/orders" className="btn btn-secondary">
            <FaEye className="mr-2" /> View All Orders
          </Link>
          <Link to="/restaurant/articles" className="btn btn-accent">
            <FaUtensils className="mr-2" /> Manage Menu
          </Link>
          <Link to="/restaurant/profile" className="btn btn-info">
            <FaEye className="mr-2" /> Restaurant Profile
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
            <Link to="/restaurant/orders" className="btn btn-sm btn-outline btn-primary">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="card bg-base-100 shadow-md p-4">
                <div className="flex items-center space-x-4">
                  <div className="skeleton h-4 w-20"></div>
                  <div className="skeleton h-4 w-32"></div>
                  <div className="skeleton h-4 w-16"></div>
                </div>
              </div>
            ) : recentOrders.length > 0 ? (
              recentOrders.map(order => (
                <div key={order.id} className="card bg-base-100 shadow-md">
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-base-content">
                          Order #{order.id}
                        </p>
                        {order.user && (
                          <p className="text-sm text-gray-500">{order.user.username}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          {order.orderItems?.length || 0} items - ${parseFloat(order.totalPrice || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="card-actions justify-end mt-2">
                      <Link to={`/restaurant/orders/${order.id}`} className="btn btn-xs btn-outline btn-primary">
                        View Details
                      </Link>
                      {order.status?.toLowerCase() === 'pending' && (
                        <button 
                          className="btn btn-xs btn-success"
                          onClick={() => handleOrderStatusUpdate(order.id, 'confirmed')}
                        >
                          Confirm
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card bg-base-100 shadow-md p-4">
                <p className="text-base-content">No recent orders.</p>
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
            <Link to="/restaurant/articles" className="btn btn-sm btn-outline btn-secondary">
              Manage Menu
            </Link>
          </div>
          <div className="space-y-4">
            {articlesLoading ? (
              <div className="card bg-base-100 shadow-md p-4">
                <div className="skeleton h-4 w-full"></div>
              </div>
            ) : (
              <>
                <div className="card bg-base-100 shadow-md p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold text-base-content">Available Items</p>
                      <p className="text-3xl font-bold text-success">{articleStats.available}</p>
                    </div>
                    <FaUtensils className="text-4xl text-success" />
                  </div>
                </div>
                {articleStats.unavailable > 0 && (
                  <div className="card bg-base-100 shadow-md p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-lg font-semibold text-base-content">Unavailable Items</p>
                        <p className="text-3xl font-bold text-warning">{articleStats.unavailable}</p>
                      </div>
                      <FaExclamationTriangle className="text-4xl text-warning" />
                    </div>
                    <div className="mt-4">
                      <Link to="/restaurant/articles" className="btn btn-sm btn-warning">
                        Update Availability
                      </Link>
                    </div>
                  </div>
                )}
                <div className="card bg-base-100 shadow-md p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold text-base-content">Total Menu Items</p>
                      <p className="text-3xl font-bold text-primary">{articleStats.total}</p>
                    </div>
                    <FaClipboardList className="text-4xl text-primary" />
                  </div>
                  <div className="mt-4">
                    <Link to="/restaurant/articles/new" className="btn btn-sm btn-primary">
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