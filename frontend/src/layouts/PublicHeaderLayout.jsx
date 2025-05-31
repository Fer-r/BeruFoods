import Header from '../components/layout/Header/Header.jsx'; // Adjust path as necessary
import { Outlet } from 'react-router';
import NotificationToast from '../components/NotificationToast';

const PublicHeaderLayout = () => {
  return (
    <div className="flex flex-col min-h-screen font-sans">
      <Header />
      <div className="flex-grow">
        <Outlet />
      </div>
      <NotificationToast />
    </div>
  );
};

export default PublicHeaderLayout;