import { useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { IoMdClose } from 'react-icons/io';
import { FaBell, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

const NotificationToast = () => {
  const { notifications, clearNotification } = useNotifications();

  useEffect(() => {
    // Auto-dismiss notifications after 5 seconds
    const timers = notifications.map((notification) => { // Kilo Code: Use notification object
      return setTimeout(() => {
        clearNotification(notification.id); // Kilo Code: Clear by ID
      }, 5000);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications, clearNotification]);

  if (notifications.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'new_order':
      case 'order_update': // Kilo Code: Added generic order update
        return <FaBell className="text-primary" />;
      case 'status_update': // Kilo Code: Changed from order_status_change to match context
        return <FaCheck className="text-success" />;
      default:
        return <FaExclamationTriangle className="text-warning" />;
    }
  };

  return (
    <div className="toast toast-end z-50">
      {notifications.map((notification) => ( // Kilo Code: Removed index
        <div
          key={notification.id} // Kilo Code: Use notification.id as key
          className="alert shadow-lg bg-base-100 mb-2"
          role="alert"
        >
          <div className="flex items-center gap-2">
            {getIcon(notification.type)}
            <span>{notification.displayMessage}</span> {/* Kilo Code: Use displayMessage */}
          </div>
          <button
            onClick={() => clearNotification(notification.id)} // Kilo Code: Clear by ID
            className="btn btn-ghost btn-xs"
            aria-label="Close notification"
          >
            <IoMdClose className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;