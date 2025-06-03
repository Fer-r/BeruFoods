import logo from '../../../assets/images/logoWithName.svg';
import { NavLink } from 'react-router';
import { GiHamburgerMenu } from 'react-icons/gi';
import UserLoginModal from './components/UserLoginModal.jsx';
import Drawer from '../../common/Drawer.jsx';

import { useModal } from '../../../context/ModalContext.jsx';
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useCart } from '../../../context/CartContext.jsx';
import { FaUserCircle, FaShoppingCart } from 'react-icons/fa';
import { GrRestaurant } from "react-icons/gr";
import NotificationBell from '../../common/NotificationBell';
import SimpleThemeToggle from '../../common/SimpleThemeToggle.jsx';

const MENU_ITEMS = {
  RESTAURANT: [
    { to: "/restaurant/dashboard", label: "Dashboard" },
    { to: "/restaurant/orders", label: "Order History" },
    { to: "/restaurant/articles", label: "Articles" }
  ],
  USER: [
    { to: "/user/orders", label: "Order History" }
  ]
};

const NavMenuItem = ({ to, onClick, children, className = "" }) => (
  <li>
    <NavLink to={to} onClick={onClick} className={`text-base ${className}`}>
      {children}
    </NavLink>
  </li>
);

const MenuButton = ({ onClick, children, className = "" }) => (
  <li>
    <button onClick={onClick} className={`text-base text-left ${className}`}>
      {children}
    </button>
  </li>
);

const ThemeSection = () => (
  <div className="mt-auto pt-6 border-t border-base-300">
    <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-base-100">
      <span className="text-base font-medium">Theme</span>
      <SimpleThemeToggle />
    </div>
  </div>
);

const UnauthenticatedDrawerContent = ({ onLoginClick, onDrawerClose }) => (
  <div className="flex flex-col h-full">
    <div className="flex-1">
      <ul className="flex flex-col gap-2">
        <li> 
          <button onClick={onLoginClick} className="btn btn-primary btn-block mb-2 text-base">
            Login
          </button>
        </li>
        <li>
          <NavLink to="/register" onClick={onDrawerClose} className="btn btn-secondary btn-block mb-2 text-base"> 
            Register
          </NavLink>
        </li>
        <li className='self-center'>
          <NavLink to="/restaurant" onClick={onDrawerClose} className="link link-hover mb-4 text-base"> 
             Enter as a restaurant
          </NavLink>
        </li>
      </ul>
    </div>
    <ThemeSection />
  </div>
);

const AuthenticatedDrawerContent = ({ isRestaurant, isUser, totalCartItems, onMenuClose, onLogout }) => (
  <div className="flex flex-col h-full">
    <div className="flex-1">
      <ul className="menu menu-lg menu-vertical px-0 gap-1">
        {isRestaurant && MENU_ITEMS.RESTAURANT.map(item => (
          <NavMenuItem key={item.to} to={item.to} onClick={onMenuClose}>
            {item.label}
          </NavMenuItem>
        ))}

        {isUser && (
          <>
            <li>
              <NavLink to="/cart" onClick={onMenuClose} className="flex items-center gap-3 text-base">
                <div className="indicator">
                  {totalCartItems > 0 && (
                    <span className="indicator-item badge badge-secondary badge-sm">{totalCartItems}</span>
                  )}
                  <FaShoppingCart className="w-5 h-5" />
                </div>
                Cart
              </NavLink>
            </li>
            {MENU_ITEMS.USER.map(item => (
              <NavMenuItem key={item.to} to={item.to} onClick={onMenuClose}>
                {item.label}
              </NavMenuItem>
            ))}
          </>
        )}

        <NavMenuItem 
          to={isRestaurant ? "/restaurant/profile" : "/user/profile"} 
          onClick={onMenuClose}
        >
          Profile
        </NavMenuItem>
        
        <MenuButton onClick={onLogout}>
          Logout
        </MenuButton>
      </ul>
    </div>
    <ThemeSection />
  </div>
);

const DesktopNavMenu = ({ isRestaurant }) => (
  <div className="navbar-center hidden lg:flex">
    {isRestaurant && (
      <ul className="menu menu-horizontal px-1">
        {MENU_ITEMS.RESTAURANT.map(item => (
          <li key={item.to}>
            <NavLink to={item.to}>{item.label}</NavLink>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const RestaurantUserActions = ({ onLogout }) => (
  <>
    <NotificationBell />
    <div className="hidden lg:flex items-center">
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
          <li><SimpleThemeToggle inMenu /></li>
          <li><button onClick={onLogout}>Logout</button></li>
        </ul>
      </div>
    </div>
  </>
);

const CustomerUserActions = ({ totalCartItems, onLogout }) => (
  <div className="flex items-center">
    <NotificationBell />
    <div className="hidden lg:flex items-center">
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
          <li><NavLink to="/user/orders">Order History</NavLink></li>
          <li><NavLink to="/user/profile">Profile</NavLink></li>
          <li><SimpleThemeToggle inMenu /></li>
          <li><button onClick={onLogout}>Logout</button></li>
        </ul>
      </div>
    </div>
  </div>
);

const Header = () => {
  const { isLoginModalOpen, openLoginModal, closeLoginModal } = useModal();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, logOut, isRestaurant, isUser } = useAuth();
  const { getCartTotalItems } = useCart();

  const totalCartItems = getCartTotalItems();

  const toggleDrawer = () => {
    if (!isAuthenticated()) {
      setIsDrawerOpen(!isDrawerOpen);
    } else {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    }
  };

  const handleOpenLoginModal = () => {
    openLoginModal();
    setIsDrawerOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleMenuClose = () => setIsMobileMenuOpen(false);

  const handleLogout = () => {
    logOut();
    setIsMobileMenuOpen(false);
  };

  const renderDrawerContent = () => {
    if (!isAuthenticated()) {
      return (
        <UnauthenticatedDrawerContent 
          onLoginClick={() => { handleOpenLoginModal(); toggleDrawer(); }}
          onDrawerClose={toggleDrawer}
        />
      );
    }

    return (
      <AuthenticatedDrawerContent
        isRestaurant={isRestaurant}
        isUser={isUser}
        totalCartItems={totalCartItems}
        onMenuClose={handleMenuClose}
        onLogout={handleLogout}
      />
    );
  };

  const renderUserActions = () => {
    if (!isAuthenticated()) {
      return (
        <button
          type="button"
          onClick={handleOpenLoginModal}
          className="btn btn-sm btn-primary ml-2"
        >
          Sign in
        </button>
      );
    }

    if (isRestaurant) {
      return <RestaurantUserActions onLogout={logOut} />;
    }

    if (isUser) {
      return <CustomerUserActions totalCartItems={totalCartItems} onLogout={logOut} />;
    }

    return null;
  };

  return (
    <>
      <div className="navbar sticky top-0 z-20 bg-base-100 text-base-content border-b border-base-300 w-full shadow-lg">
        <div className="navbar-start">
          <button 
            onClick={toggleDrawer}
            className={`btn btn-square btn-ghost mr-1 ${isAuthenticated() ? 'lg:hidden' : ''}`}
          >
            <GiHamburgerMenu className="inline-block w-5 h-5" />
          </button>
          <NavLink to="/" className="btn text-xl h-auto px-3 py-0 btn-link">
            <img src={logo} alt="Logo" className='h-10' />
          </NavLink>
        </div>

        <DesktopNavMenu isRestaurant={isRestaurant} />

        <div className="navbar-end">
          {renderUserActions()}
        </div>
      </div>

      <Drawer 
        isOpen={!isAuthenticated() ? isDrawerOpen : isMobileMenuOpen}
        onClose={toggleDrawer}
        position="left"
      >
        {renderDrawerContent()}
      </Drawer>

      <UserLoginModal open={isLoginModalOpen} handleClose={closeLoginModal} />
    </>
  );
};

export default Header;