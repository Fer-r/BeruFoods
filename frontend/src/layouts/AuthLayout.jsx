import { Outlet, Link } from 'react-router';
import logo from '../assets/images/logoWithName.svg';

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