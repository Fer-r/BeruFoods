import { useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../context/AuthContext';
import useMercure from '../hooks/useMercure';

const GlobalNotifications = () => {
  const { entity, token } = useAuth();
  
  const topic = entity?.restaurantId 
    ? `restaurant/${entity.restaurantId}`
    : entity?.userId 
      ? `user/${entity.userId}`
      : null;

  const { messages, error } = useMercure(topic, token);

  useEffect(() => {
    if (error) {
      toast.error(error, {
        position: "top-right",
        autoClose: 5000
      });
    }
  }, [error]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'order.created':
        toast.success(`New order received from ${lastMessage.data.customerName}!`, {
          position: "top-right",
          autoClose: 5000
        });
        break;
      case 'order.confirmed':
        toast.success(`Order #${lastMessage.data.orderId} confirmed by ${lastMessage.data.restaurantName}`, {
          position: "top-right",
          autoClose: 5000
        });
        break;
      case 'order.status_updated':
        toast.info(`Order #${lastMessage.data.orderId} status changed from ${lastMessage.data.oldStatus} to ${lastMessage.data.newStatus}`, {
          position: "top-right",
          autoClose: 5000
        });
        break;
      default:
        console.log('Unhandled notification type:', lastMessage.type);
    }
  }, [messages]);

  return <ToastContainer />;
};

export default GlobalNotifications;