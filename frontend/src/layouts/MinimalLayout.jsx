import { Outlet } from 'react-router';

const MinimalLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Outlet />
    </div>
  );
};

export default MinimalLayout; 