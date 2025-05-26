import Header from '../components/layout/Header/Header.jsx'; // Adjust path as necessary
import { Outlet } from 'react-router';

const PublicHeaderLayout = () => { // Remove unused children prop from signature
  return (
    <div className="flex flex-col min-h-screen font-sans">
      <Header />
      <div className="flex-grow"> {/* Ensure content area grows */}
        <Outlet />
      </div>
    </div>
  );
};
export default PublicHeaderLayout;