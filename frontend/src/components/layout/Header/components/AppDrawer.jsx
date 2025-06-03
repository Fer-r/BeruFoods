import { NavLink } from 'react-router';
import { useEffect } from 'react';
import SimpleThemeToggle from '../../../common/SimpleThemeToggle.jsx';
import { IoClose } from 'react-icons/io5';

/**
 * AppDrawer renders a slide-in drawer menu primarily intended for unauthenticated users.
 * It provides navigation options such as Login, Register, and an entry point for restaurants.
 * Additionally, it includes a theme toggle to switch between light and dark modes.
 * The drawer's visibility and the triggering of the login modal are managed via props.
 *
 * @param {object} props - The component's props.
 * @param {function} props.toggleDrawer - Callback function to open or close the drawer. This is typically called when the close button is clicked or when a navigation action within the drawer is performed.
 * @param {function} props.handleOpenLoginModal - Callback function to open the main login modal. This is triggered when the 'Login' button in the drawer is clicked.
 */
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
    <div className="menu p-6 w-80 min-h-full bg-base-200 text-base-content flex flex-col">
      <div className="flex justify-end mb-4">
        <label htmlFor="main-drawer" className="btn btn-circle btn-ghost" onClick={toggleDrawer}>
          <IoClose className="w-6 h-6" />
        </label>
      </div>

      <div className="flex-1">
        <ul className="flex flex-col gap-2">
          <li> 
            <button onClick={() => { handleOpenLoginModal(); toggleDrawer(); }} className="btn btn-primary btn-block mb-2 text-base">Login</button>
          </li>
          <li>
            <NavLink to="/register" onClick={toggleDrawer} className="btn btn-secondary btn-block mb-2 text-base"> 
              Register
            </NavLink>
          </li>
          <li>
            <NavLink to="/restaurant" onClick={toggleDrawer} className="link link-hover justify-center mb-4 text-base"> 
               Enter as a restaurant
            </NavLink>
          </li>
        </ul>
      </div>

      <div className="mt-auto pt-6 border-t border-base-300">
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-base-100">
          <span className="text-base font-medium">Theme</span>
          <SimpleThemeToggle />
        </div>
      </div>
    </div>
  );
};

export default AppDrawer; 