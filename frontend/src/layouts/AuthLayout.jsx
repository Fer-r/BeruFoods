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
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <div className="mb-6">
            <Link to="/">
              <img src={logo} alt="BeruFoods Logo" className="h-14 inline-block" />
            </Link>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;