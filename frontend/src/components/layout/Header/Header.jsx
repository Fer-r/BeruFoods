import logo from '../../../assets/images/logoWithName.svg';
import { NavLink } from 'react-router';
import { GiHamburgerMenu } from 'react-icons/gi';
import UserLoginModal from './components/UserLoginModal.jsx';
import AppDrawer from './components/AppDrawer.jsx';
import { useModal } from '../../../context/ModalContext.jsx';
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useCart } from '../../../context/CartContext.jsx';
import { FaUserCircle, FaShoppingCart } from 'react-icons/fa';
import { GrRestaurant } from "react-icons/gr";
import NotificationBell from '../../components/NotificationBell';

const Header = () => {
  const { isLoginModalOpen, openLoginModal, closeLoginModal } = useModal();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { isAuthenticated, logOut, isRestaurant, isUser } = useAuth();
  const { getCartTotalItems } = useCart();

  const toggleDrawer = () => {
    if (!isAuthenticated()) {
      setIsDrawerOpen(!isDrawerOpen);
    }
  };

  const handleOpenLoginModal = () => {
    openLoginModal();
    setIsDrawerOpen(false);
  };

  const totalCartItems = getCartTotalItems();

  return (
    <div className="drawer">
      <input 
        id="main-drawer" 
        type="checkbox" 
        className="drawer-toggle" 
        checked={!isAuthenticated() && isDrawerOpen} 
        onChange={toggleDrawer} 
        disabled={isAuthenticated()}
      />
      <div className="drawer-content flex flex-col">
        <div className="navbar sticky top-0 z-10 bg-base-100 text-base-content border-b border-base-300 w-full shadow-lg">
          <div className="navbar-start">
            {!isAuthenticated() && (
              <label htmlFor="main-drawer" className="btn btn-square btn-ghost drawer-button mr-1">
                <GiHamburgerMenu className="inline-block w-5 h-5" />
              </label>
            )}
            <NavLink to="/" className="btn text-xl h-auto p-0 btn-link">
              <img src={logo} alt="Logo" className='h-10' />
            </NavLink>
          </div>

          <div className="navbar-center hidden lg:flex">
            {isRestaurant && (
              <ul className="menu menu-horizontal px-1">
                <li><NavLink to="/restaurant/dashboard">Dashboard</NavLink></li>
                <li><NavLink to="/restaurant/orders">Order History</NavLink></li>
                <li><NavLink to="/restaurant/bookings">Booking History</NavLink></li>
                <li><NavLink to="/restaurant/articles">Articles</NavLink></li>
              </ul>
            )}
            {isUser && (
              <ul className="menu menu-horizontal px-1">
                <li><NavLink to="/user/orders">Order History</NavLink></li>
                <li><NavLink to="/user/reservations">Reservations</NavLink></li>
              </ul>
            )}
          </div>

          <div className="navbar-end">
            {isAuthenticated() ? (
              isRestaurant ? (
                <>
                  <NotificationBell />
                  <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                      <div className="w-10 h-10 rounded-full bg-base-200 relative">
                        <GrRestaurant className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                    </label>
                    <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                      <li>
                        <NavLink to="/restaurant/profile">Profile</NavLink>
                      </li>
                      <li><button onClick={logOut}>Logout</button></li>
                      <li className="divider lg:hidden"></li>
                      <li className="lg:hidden"><NavLink to="/restaurant/dashboard">Dashboard</NavLink></li>
                      <li className="lg:hidden"><NavLink to="/restaurant/orders">Order History</NavLink></li>
                      <li className="lg:hidden"><NavLink to="/restaurant/bookings">Booking History</NavLink></li>
                      <li className="lg:hidden"><NavLink to="/restaurant/articles">Articles</NavLink></li>
                    </ul>
                  </div>
                </>
              ) : isUser ? (
                <>
                  <NotificationBell />
                  <NavLink to="/cart" className="btn btn-ghost btn-circle mr-4 indicator">
                    {totalCartItems > 0 && (
                      <span className="indicator-item badge badge-secondary badge-sm">{totalCartItems}</span>
                    )}
                    <FaShoppingCart className="w-5 h-5" />
                  </NavLink>
                  <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                      <div className="w-10 rounded-full">
                        <FaUserCircle className="w-full h-full" />
                      </div>
                    </label>
                    <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                      <li><NavLink to="/user/profile">Profile</NavLink></li>
                      <li><button onClick={logOut}>Logout</button></li>
                    </ul>
                  </div>
                </>
              ) : null
            ) : (
              <button
                type="button"
                onClick={handleOpenLoginModal}
                className="btn btn-sm btn-primary ml-2"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>

      {!isAuthenticated() && (
        <AppDrawer 
          toggleDrawer={toggleDrawer} 
          handleOpenLoginModal={handleOpenLoginModal}
        />
      )}

      <UserLoginModal open={isLoginModalOpen} handleClose={closeLoginModal} />
    </div>
  );
};

export default Header;