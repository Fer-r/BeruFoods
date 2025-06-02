// import React from 'react';
import { Link } from 'react-router'; // Added for Quick Action buttons
import { FaPlusSquare, FaEye, FaBell, FaShoppingCart, FaCalendarCheck, FaMoneyBillWave, FaClipboardList } from 'react-icons/fa'; // Added icons

const RestaurantDashboard = () => {
  //TODO: Get data from API
  // Placeholder data - in a real app, this would come from an API
  const performanceSummary = {
    totalOrders: 125,
    totalRevenue: 2560.75,
    newBookings: 15,
  };

  const latestOrders = [
    { id: 'ORD10023', customer: 'Jane Doe', items: 3, total: 45.00, status: 'Preparing' },
    { id: 'ORD10022', customer: 'John Smith', items: 1, total: 12.50, status: 'Pending Confirmation' },
    { id: 'ORD10021', customer: 'Alice Brown', items: 5, total: 78.20, status: 'Delivered' },
  ];

  const upcomingBookings = [
    { id: 'BOOK005', name: 'Robert Kiyosaki', time: 'Today, 7:00 PM', guests: 4 },
    { id: 'BOOK008', name: 'Harv Eker', time: 'Tomorrow, 1:00 PM', guests: 2 },
  ];

  const notifications = [
    { id: 1, message: 'New order #ORD10024 received from Bob Johnson.', time: '2 mins ago', unread: true },
    { id: 2, message: 'Order #ORD10020 has been marked as completed.', time: '1 hour ago', unread: false },
  ];

  return (
    <div className="p-6 bg-base-200 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-base-content">Restaurant Dashboard</h1>

      {/* Notifications/Alerts */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-base-content flex items-center">
          <FaBell className="mr-3 text-primary" /> Notifications
        </h2>
        <div className="space-y-3">
          {notifications.length > 0 ? (
            notifications.map(notification => (
              <div key={notification.id} className={`card bg-base-100 shadow-md p-4 ${notification.unread ? 'border-l-4 border-accent' : ''}`}>
                <p className="text-sm text-base-content">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
              </div>
            ))
          ) : (
            <div className="card bg-base-100 shadow-md p-4">
              <p className="text-base-content">No new notifications.</p>
            </div>
          )}
        </div>
      </section>

      {/* Performance Summary */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-base-content">This Week&apos;s Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card bg-base-100 shadow-xl p-6">
            <div className="flex items-center">
              <FaShoppingCart className="text-3xl text-primary mr-4" />
              <div>
                <p className="text-lg font-semibold text-base-content">Total Orders</p>
                <p className="text-2xl font-bold text-primary">{performanceSummary.totalOrders}</p>
              </div>
            </div>
          </div>
          <div className="card bg-base-100 shadow-xl p-6">
            <div className="flex items-center">
              <FaMoneyBillWave className="text-3xl text-secondary mr-4" />
              <div>
                <p className="text-lg font-semibold text-base-content">Total Revenue</p>
                <p className="text-2xl font-bold text-secondary">${performanceSummary.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="card bg-base-100 shadow-xl p-6">
            <div className="flex items-center">
              <FaCalendarCheck className="text-3xl text-accent mr-4" />
              <div>
                <p className="text-lg font-semibold text-base-content">New Bookings</p>
                <p className="text-2xl font-bold text-accent">{performanceSummary.newBookings}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Action Buttons */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-base-content">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/restaurant/articles/new" className="btn btn-primary">
            <FaPlusSquare className="mr-2" /> Add New Article
          </Link>
          <Link to="/restaurant/orders" className="btn btn-secondary">
            <FaEye className="mr-2" /> View Orders
          </Link>
           {/* Add more relevant quick actions as needed */}
        </div>
      </section>

      {/* Recent Activity Feeds */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-base-content flex items-center">
            <FaClipboardList className="mr-3 text-info" /> Latest Orders
          </h2>
          <div className="space-y-4">
            {latestOrders.length > 0 ? (
              latestOrders.map(order => (
                <div key={order.id} className="card bg-base-100 shadow-md">
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-base-content">{order.id} - {order.customer}</p>
                        <p className="text-sm text-gray-500">{order.items} items - ${order.total.toFixed(2)}</p>
                      </div>
                      <span className={`badge ${order.status === 'Preparing' ? 'badge-warning' : order.status === 'Pending Confirmation' ? 'badge-info' : 'badge-success'}`}>{order.status}</span>
                    </div>
                    <div className="card-actions justify-end mt-2">
                      <Link to={`/restaurant/orders/${order.id}`} className="btn btn-xs btn-outline btn-primary">View Details</Link>
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

        <div>
          <h2 className="text-2xl font-semibold mb-4 text-base-content flex items-center">
            <FaCalendarCheck className="mr-3 text-success" /> Upcoming Bookings (Next 48 Hours)
          </h2>
          <div className="space-y-4">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map(booking => (
                <div key={booking.id} className="card bg-base-100 shadow-md">
                  <div className="card-body p-4">
                    <p className="font-semibold text-base-content">{booking.name} - {booking.guests} guests</p>
                    <p className="text-sm text-gray-500">{booking.time}</p>
                    <div className="card-actions justify-end mt-2">
                      <Link to={`/restaurant/bookings/${booking.id}`} className="btn btn-xs btn-outline btn-secondary">View Details</Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card bg-base-100 shadow-md p-4">
                <p className="text-base-content">No upcoming bookings.</p>
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};

export default RestaurantDashboard; 