import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext'; // Adjust path as necessary
import { FaBell } from 'react-icons/fa'; // Using react-icons for the bell icon

const NotificationBell = () => {
  const {
    notifications,
    notificationError,
    markNotificationAsRead, // Renamed from markAsRead for clarity if used elsewhere
    clearAllNotifications,  // Renamed for clarity
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleToggle = () => setIsOpen(!isOpen);

  const handleMarkAsReadClick = (id) => {
    markNotificationAsRead(id);
    // Optionally, keep the dropdown open or close it based on UX preference
  };

  const handleClearAllClick = () => {
    clearAllNotifications();
    setIsOpen(false); // Close dropdown after clearing
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={handleToggle} className="btn btn-ghost btn-circle relative">
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 block h-4 w-4 transform translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount} 
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-base-100 border border-base-300 rounded-box shadow-lg py-1 z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-2 font-semibold border-b border-base-300 flex justify-between items-center">
            <span>Notifications</span>
            {notifications.length > 0 && (
                <button 
                    onClick={handleClearAllClick}
                    className="text-xs text-primary hover:underline"
                >
                    Clear All
                </button>
            )}
          </div>
          {notificationError && <div className="px-4 py-2 text-error text-sm">{notificationError}</div>}
          {notifications.length === 0 && !notificationError && (
            <div className="px-4 py-3 text-sm text-base-content/70">No new notifications.</div>
          )}
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`px-4 py-3 border-b border-base-200 hover:bg-base-200 cursor-pointer ${!notif.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
              onClick={() => handleMarkAsReadClick(notif.id)}
              title={notif.isRead ? "Marked as read" : "Click to mark as read"}
            >
              <div className={`text-sm ${!notif.isRead ? 'font-semibold text-base-content' : 'text-base-content/80'}`}>
                {notif.message}
              </div>
              <div className="text-xs text-base-content/60 mt-1">
                {new Date(notif.createdAt).toLocaleString()}
              </div>
              {!notif.isRead && (
                <div className="text-xs text-primary font-semibold mt-1 text-right">New</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 