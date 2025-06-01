import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { FaBell } from 'react-icons/fa';
import { useNotifications } from '../context/NotificationContext';

const NotificationBell = () => {
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
    <div className="relative" ref={dropdownRef}>
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
        <div className="dropdown-content z-50 menu p-2 shadow bg-base-100 rounded-box w-80 absolute right-0 mt-2">
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
            <div className="py-4 text-center">Loading...</div>
          ) : persistentNotifications.length === 0 ? (
            <div className="py-4 text-center text-gray-500">
              No {viewingUnread ? "unread " : ""}notifications
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {persistentNotifications.map(notification => (
                <div 
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    p-2 mb-1 rounded cursor-pointer hover:bg-base-200 
                    ${notification.isRead ? 'opacity-70' : 'font-semibold bg-base-200'}
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
                    <div className="text-xs text-primary">
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