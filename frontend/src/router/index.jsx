import { createBrowserRouter } from "react-router";
import Home from "../pages/Home/Home.jsx";
import PublicHeaderLayout from "../layout/PublicHeaderLayout.jsx";
import MinimalLayout from "../layout/MinimalLayout";
import AuthLayout from "../layout/AuthLayout.jsx";
import UserRegister from "../pages/Auth/UserRegister";
import RestaurantLogin from "../pages/Auth/RestaurantLogin.jsx";
import RestaurantDashboard from "../pages/Restaurant/RestaurantDashboard.jsx";
import RestaurantRedirect from "../pages/Auth/RestaurantRedirect.jsx";
import RestaurantRegister from "../pages/Auth/RestaurantRegister";

export const router = createBrowserRouter([
  {
    element: <PublicHeaderLayout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
    ],
  },
  {
    element: <MinimalLayout />,
    children: [
      {
        path: "/restaurant",
        element: <RestaurantRedirect />,
      },
      {
        path: "/restaurant/dashboard",
        element: <RestaurantDashboard />,
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/register",
        element: <UserRegister />,
      },
      {
        path: "/restaurant/register",
        element: <RestaurantRegister />,
      },
      {
        path: "/restaurant/login",
        element: <RestaurantLogin />,
      },
    ],
  },
]);