import { Outlet, Link } from 'react-router';
import logo from '../assets/images/logoWithName.svg';

/**
 * @component AuthLayout
 * Provides a consistent layout structure for authentication-related pages,
 * such as login, registration, and password reset forms.
 * This layout centers the content on the page within a card container
 * and displays the application logo above the specific authentication form.
 *
 * The actual form content for each authentication page (e.g., login form, registration form)
 * is rendered via the `<Outlet />` component from `react-router-dom`.
 *
 * This component does not take direct props that need documenting beyond standard component behavior.
 *
 * @returns {JSX.Element} The rendered authentication layout.
 */
const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25px 25px, var(--color-primary) 2px, transparent 0)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-b from-primary/20 to-transparent rounded-full blur-3xl -z-10 transform translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-t from-secondary/20 to-transparent rounded-full blur-3xl -z-10 transform -translate-x-1/3 translate-y-1/3"></div>
      
      <div className="card w-full max-w-md bg-base-100 shadow-xl auth-container">
        <div className="card-body items-center text-center">
          <div className="mb-6 transform hover:scale-105 transition-transform">
            <Link to="/">
              <img src={logo} alt="BeruFoods Logo" className="h-14 inline-block drop-shadow-md" />
            </Link>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;