import { createBrowserRouter } from "react-router";
import { Suspense, lazy } from 'react';
import PublicHeaderLayout from "../layout/PublicHeaderLayout.jsx";
import MinimalLayout from "../layout/MinimalLayout";
import AuthLayout from "../layout/AuthLayout.jsx";
import LoadingFallback from "../components/LoadingFallback.jsx";
import { RestaurantRoute } from "./ProtectedRoutes.jsx";
const ErrorPage = lazy(() => import("../pages/ErrorPage.jsx"));

const Home = lazy(() => import("../pages/Home/Home.jsx"));
const UserRegister = lazy(() => import("../pages/Auth/UserRegister"));
const RestaurantLogin = lazy(() => import("../pages/Auth/RestaurantLogin.jsx"));
const RestaurantDashboard = lazy(() => import("../pages/Restaurant/RestaurantDashboard.jsx"));
const RestaurantRedirect = lazy(() => import("../pages/Auth/RestaurantRedirect.jsx"));
const RestaurantRegister = lazy(() => import("../pages/Auth/RestaurantRegister"));
const RestaurantArticlesPage = lazy(() => import("../pages/Restaurant/RestaurantArticlesPage.jsx"));

export const router = createBrowserRouter([
  {
    element: <PublicHeaderLayout />,
    errorElement: <Suspense fallback={<LoadingFallback />}><ErrorPage /></Suspense>,
    children: [
      {
        path: "/",
        element: <Suspense fallback={<LoadingFallback />}><Home /></Suspense>,
      },
      {
        path: "/restaurants/:restaurantId/articles",
        element: <Suspense fallback={<LoadingFallback />}><RestaurantArticlesPage /></Suspense>,
      },
    ],
  },
  {
    element: <MinimalLayout />,
    errorElement: <Suspense fallback={<LoadingFallback />}><ErrorPage /></Suspense>,
    children: [
      {
        path: "/restaurant",
        element: <Suspense fallback={<LoadingFallback />}><RestaurantRedirect /></Suspense>,
      },
      {
        path: "/restaurant/dashboard",
        element: (
          <RestaurantRoute>
            <Suspense fallback={<LoadingFallback />}>
              <RestaurantDashboard />
            </Suspense>
          </RestaurantRoute>
        ),
      },
    ],
  },
  {
    element: <AuthLayout />,
    errorElement: <Suspense fallback={<LoadingFallback />}><ErrorPage /></Suspense>,
    children: [
      {
        path: "/register",
        element: <Suspense fallback={<LoadingFallback />}><UserRegister /></Suspense>,
      },
      {
        path: "/restaurant/register",
        element: <Suspense fallback={<LoadingFallback />}><RestaurantRegister /></Suspense>,
      },
      {
        path: "/restaurant/login",
        element: <Suspense fallback={<LoadingFallback />}><RestaurantLogin /></Suspense>,
      },
    ],
  },
]);