import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { FaBell } from 'react-icons/fa';
import { useNotifications } from '../../context/NotificationContext';

/**
 * NotificationBell displays a bell icon that shows a count of unread notifications.
 * When clicked, it opens a dropdown listing recent notifications. Users can view notifications,
 * mark them as read individually, mark all as read, and navigate to notification-related content (e.g., specific orders).
 * The component fetches and manages notification state through the `useNotifications` hook,
 * which connects to the NotificationContext. It allows toggling between viewing only unread
 * notifications and all notifications.
 * This component does not accept direct props as it relies on the NotificationContext for its data and actions.
 */
const NotificationBell = ({ className = "" }) => {
  const { 
    persistentNotifications, 
    unreadCount, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    loading,
    fetchUnreadCount
  } = useNotifications();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [viewingUnread, setViewingUnread] = useState(true);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  // Fetch notifications when dropdown is opened
  const toggleDropdown = () => {
    const newState = !dropdownOpen;
    setDropdownOpen(newState);
    
    // If opening the dropdown, fetch notifications and update unread count
    if (newState) {
      fetchNotifications(1, viewingUnread ? false : null);
      fetchUnreadCount(); // Ensure unread count is up-to-date
    }
  };

  // Initial fetch of unread count (removed periodic interval)
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Navigate to the related entity
    if (notification.relatedEntityType === 'order' && notification.relatedEntityId) {
      navigate(`/orders/${notification.relatedEntityId}`);
      setDropdownOpen(false);
    }
  };
  
  // Toggle between unread and all notifications
  const toggleView = () => {
    setViewingUnread(!viewingUnread);
    fetchNotifications(1, viewingUnread ? null : false);
  };
  
  return (
    <div className={`relative px-2 ${className}`} ref={dropdownRef}>
      <button
        className="btn btn-ghost btn-circle"
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        <div className="indicator">
          <FaBell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="indicator-item badge badge-primary badge-sm">{unreadCount}</span>
          )}
        </div>
      </button>
      
      {dropdownOpen && (
        <div className="dropdown-content z-50 menu p-2 shadow-lg bg-base-100 rounded-box w-80 absolute right-0 mt-2 border border-base-300">
          <div className="flex justify-between items-center mb-2 border-b pb-2">
            <h3 className="font-bold">
              {viewingUnread ? "Unread Notifications" : "All Notifications"}
            </h3>
            <div className="flex gap-2">
              <button 
                className="btn btn-xs btn-ghost" 
                onClick={toggleView}
              >
                {viewingUnread ? "View All" : "View Unread"}
              </button>
              {unreadCount > 0 && (
                <button 
                  className="btn btn-xs btn-primary" 
                  onClick={markAllAsRead}
                >
                  Mark All Read
                </button>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="py-4 text-center">
              <span className="loading loading-spinner loading-sm text-primary mr-2"></span>
              Loading...
            </div>
          ) : persistentNotifications.length === 0 ? (
            <div className="py-8 text-center text-base-content/60">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p>No {viewingUnread ? "unread " : ""}notifications</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {persistentNotifications.map(notification => (
                <div 
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    p-3 mb-2 rounded-lg cursor-pointer hover:bg-base-200 transition-colors
                    ${notification.isRead ? 'opacity-70' : 'font-semibold bg-base-200 border-l-4 border-primary'}
                  `}
                >
                  <div className="flex justify-between">
                    <span className="text-sm">{notification.message}</span>
                    <span className="text-xs opacity-50">
                      {new Date(notification.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {notification.relatedEntityType === 'order' && (
                    <div className="text-xs text-primary mt-1">
                      Click to view order #{notification.relatedEntityId}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;