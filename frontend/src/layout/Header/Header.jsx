import logo from '../../assets/images/logoWithName.svg';
import { useState } from 'react';
import { NavLink } from 'react-router';
import { GiHamburgerMenu } from 'react-icons/gi';
import UserLoginModal from './components/UserLoginModal.jsx';
import AppDrawer from './components/AppDrawer.jsx';

const Header = () => {
  const [openLoginModal, setOpenLoginModal] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleOpenLoginModal = () => {
    setOpenLoginModal(true);
    setIsDrawerOpen(false);
  };

  const handleCloseLoginModal = () => {
    setOpenLoginModal(false);
  };

  const handleRegisterClick = () => {
    console.log("Register clicked");
    toggleDrawer();
  };

  return (
    <div className="drawer">
      <input id="main-drawer" type="checkbox" className="drawer-toggle" checked={isDrawerOpen} onChange={toggleDrawer} />
      <div className="drawer-content flex flex-col">
        <div className="navbar sticky top-0 z-10 bg-base-100 text-base-content border-b border-base-300 w-full shadow-lg">
          <div className="navbar-start">
            <label htmlFor="main-drawer" className="btn btn-square btn-ghost drawer-button mr-1">
              <GiHamburgerMenu className="inline-block w-5 h-5" />
            </label>
            <NavLink to="/" className="btn text-xl h-auto p-0 btn-link">
              <img src={logo} alt="Logo" className='h-10' />
            </NavLink>
          </div>

          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal px-1">
              {/* <li><NavLink to="/browse">Browse</NavLink></li>
              <li><NavLink to="/deals" >Deals</NavLink></li>
              <li><NavLink to="/delivery" >Delivery</NavLink></li>
              <li><NavLink to="/pantry">Pantry</NavLink></li>
              <li><NavLink to="/gift-cards">Gift Cards</NavLink></li> */}
            </ul>
          </div>

          <div className="navbar-end">
             <button
               type="button"
               onClick={handleOpenLoginModal}
               className="btn btn-sm btn-primary ml-2"
             >
               Sign in
             </button>
          </div>
        </div>
      </div>

      <AppDrawer 
        toggleDrawer={toggleDrawer} 
        handleOpenLoginModal={handleOpenLoginModal}
        handleRegisterClick={handleRegisterClick}
      />

      <UserLoginModal open={openLoginModal} handleClose={handleCloseLoginModal} />
    </div>
  );
};

export default Header;