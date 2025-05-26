import { NavLink } from 'react-router';
import { useEffect } from 'react';
import ThemeToggleButton from './ThemeToggleButton.jsx';

const AppDrawer = ({ toggleDrawer, handleOpenLoginModal }) => {

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        toggleDrawer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleDrawer]);

  return (
    <div className="drawer-side z-20">
      <label 
        htmlFor="main-drawer" 
        aria-label="close sidebar" 
        className="drawer-overlay !cursor-default"
      ></label>
      <ul className="menu p-4 w-80 min-h-full bg-base-200 text-base-content flex flex-col">
        <li> 
          <button onClick={toggleDrawer} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
        </li>

        <li className="mt-4"> 
          <button onClick={() => { handleOpenLoginModal(); toggleDrawer(); }} className="btn btn-primary btn-block mb-2">Login</button>
        </li>
        <li>
          <NavLink to="/register" onClick={toggleDrawer} className="btn btn-secondary btn-block mb-2"> 
            Register
          </NavLink>
        </li>
        <li>
          <NavLink to="/restaurant" onClick={toggleDrawer} className="link link-hover justify-center mb-4"> 
             Enter as a restaurant
          </NavLink>
        </li>

        <li className="mt-auto dropdown dropdown-top" tabIndex={0}> 
          <ThemeToggleButton />
        </li>
      </ul>
    </div>
  );
};



export default AppDrawer; 