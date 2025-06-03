import logo from '../../../assets/images/logoWithName.svg';
import { NavLink } from 'react-router';
import { GiHamburgerMenu } from 'react-icons/gi';
import { IoClose } from 'react-icons/io5';
import UserLoginModal from './components/UserLoginModal.jsx';
import { useModal } from '../../../context/ModalContext.jsx';
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useCart } from '../../../context/CartContext.jsx';
import { FaUserCircle, FaShoppingCart } from 'react-icons/fa';
import { GrRestaurant } from "react-icons/gr";
import NotificationBell from '../../common/NotificationBell';
import ThemeToggleButton from './components/ThemeToggleButton.jsx';

const Header = () => {
  const { isLoginModalOpen, openLoginModal, closeLoginModal } = useModal();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, logOut, isRestaurant, isUser } = useAuth();
  const { getCartTotalItems } = useCart();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleOpenLoginModal = () => {
    openLoginModal();
    closeMobileMenu();
  };

  const totalCartItems = getCartTotalItems();

  const RestaurantNavLinks = ({ mobile = false, onLinkClick = () => {} }) => (
    <ul className={`menu ${mobile ? 'menu-vertical' : 'menu-horizontal'} px-1`}>
      <li><NavLink to="/restaurant/dashboard" onClick={onLinkClick}>Dashboard</NavLink></li>
      <li><NavLink to="/restaurant/orders" onClick={onLinkClick}>Order History</NavLink></li>
      <li><NavLink to="/restaurant/articles" onClick={onLinkClick}>Articles</NavLink></li>
    </ul>
  );

  const UserNavLinks = ({ mobile = false, onLinkClick = () => {} }) => (
    <ul className={`menu ${mobile ? 'menu-vertical' : 'menu-horizontal'} px-1`}>
      <li><NavLink to="/user/orders" onClick={onLinkClick}>Order History</NavLink></li>
    </ul>
  );

  return (
    <>
      <div className="navbar sticky top-0 z-10 bg-base-100 text-base-content border-b border-base-300 w-full shadow-lg">
        {/* Navbar Start */}
        <div className="navbar-start">
          <button
            onClick={toggleMobileMenu}
            className="btn btn-square btn-ghost lg:hidden mr-2"
            aria-label="Toggle mobile menu"
          >
            <GiHamburgerMenu className="w-5 h-5" />
          </button>
          
          <NavLink to="/" className="btn text-xl h-auto p-0 btn-link ml-2 lg:ml-4">
            <img src={logo} alt="BeruFoods Logo" className="h-10" />
          </NavLink>
        </div>

        {/* Navbar Center - Desktop Navigation */}
        <div className="navbar-center hidden lg:flex">
          {isRestaurant && <RestaurantNavLinks />}
          {isUser && <UserNavLinks />}
        </div>

        {/* Navbar End */}
        <div className="navbar-end space-x-2 mr-2 lg:mr-4">
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
                    <li><NavLink to="/restaurant/profile">Profile</NavLink></li>
                    <li><button onClick={logOut}>Logout</button></li>
                  </ul>
                </div>
              </>
            ) : isUser ? (
              <>
                <NotificationBell />
                <NavLink to="/cart" className="btn btn-ghost btn-circle indicator">
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
              className="btn btn-sm btn-primary"
            >
              Sign in
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50" 
            onClick={closeMobileMenu}
          ></div>
          
          {/* Mobile Menu */}
          <div className="absolute top-0 left-0 h-full w-80 bg-base-100 shadow-xl transform transition-transform duration-300 ease-in-out">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-base-300">
              <img src={logo} alt="BeruFoods Logo" className="h-8" />
              <button
                onClick={closeMobileMenu}
                className="btn btn-sm btn-circle btn-ghost"
                aria-label="Close mobile menu"
              >
                <IoClose className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Menu Content */}
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto">
                {/* Authentication Section */}
                {!isAuthenticated() && (
                  <div className="p-4 border-b border-base-300">
                    <button
                      onClick={handleOpenLoginModal}
                      className="btn btn-primary btn-block mb-3"
                    >
                      Sign in
                    </button>
                    <NavLink
                      to="/register"
                      onClick={closeMobileMenu}
                      className="btn btn-secondary btn-block mb-3"
                    >
                      Register
                    </NavLink>
                    <NavLink
                      to="/restaurant"
                      onClick={closeMobileMenu}
                      className="link link-hover text-center block"
                    >
                      Enter as a restaurant
                    </NavLink>
                  </div>
                )}

                {/* Navigation Links */}
                {isAuthenticated() && (
                  <div className="p-4">
                    {isRestaurant && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-base-content/70 mb-3 uppercase tracking-wider">
                          Restaurant
                        </h3>
                        <RestaurantNavLinks mobile onLinkClick={closeMobileMenu} />
                      </div>
                    )}
                    
                    {isUser && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-base-content/70 mb-3 uppercase tracking-wider">
                          Account
                        </h3>
                        <UserNavLinks mobile onLinkClick={closeMobileMenu} />
                      </div>
                    )}

                    {/* User Actions */}
                    <div className="border-t border-base-300 pt-4">
                      <ul className="menu menu-vertical px-1">
                        <li>
                          <NavLink 
                            to={isRestaurant ? "/restaurant/profile" : "/user/profile"} 
                            onClick={closeMobileMenu}
                          >
                            Profile
                          </NavLink>
                        </li>
                        <li>
                          <button onClick={() => { logOut(); closeMobileMenu(); }}>
                            Logout
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <div className="p-4 border-t border-base-300">
                <ThemeToggleButton />
              </div>
            </div>
          </div>
        </div>
      )}

      <UserLoginModal open={isLoginModalOpen} handleClose={closeLoginModal} />
    </>
  );
};

export default Header;