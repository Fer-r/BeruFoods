import Header from '../components/layout/Header/Header.jsx'; // Adjust path as necessary
import { Outlet } from 'react-router';
import NotificationToast from '../components/common/NotificationToast';

/**
 * @component PublicHeaderLayout
 * Provides a standard layout structure that includes the main application header
 * and notification toast system. This is the primary layout used for most pages
 * in the application that require navigation and user interface elements.
 * 
 * The layout consists of:
 * 1. A fixed header at the top with navigation, user controls, and branding
 * 2. A flexible content area that grows to fill available space
 * 3. A notification toast system for displaying temporary messages
 * 
 * The content for pages using this layout is rendered via the `<Outlet />` component
 * from react-router-dom.
 * 
 * This component does not accept any props.
 * 
 * @returns {JSX.Element} The rendered layout with header, content area, and notification system.
 */
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