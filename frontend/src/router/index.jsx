import { createBrowserRouter } from "react-router";
import { Suspense, lazy } from 'react';
import PublicHeaderLayout from "../layout/PublicHeaderLayout.jsx";
import MinimalLayout from "../layout/MinimalLayout";
import AuthLayout from "../layout/AuthLayout.jsx";
import LoadingFallback from "../components/LoadingFallback.jsx";
import { RestaurantRoute, UserRoute } from "./ProtectedRoutes.jsx";
const ErrorPage = lazy(() => import("../pages/ErrorPage.jsx"));

const HomeHandler = lazy(() => import("../pages/HomeHandler.jsx"));
const UserRegister = lazy(() => import("../pages/Auth/UserRegister"));
const RestaurantLogin = lazy(() => import("../pages/Auth/RestaurantLogin.jsx"));
const RestaurantDashboard = lazy(() => import("../pages/Restaurant/RestaurantDashboard.jsx"));
const RestaurantRedirect = lazy(() => import("../pages/Auth/RestaurantRedirect.jsx"));
const RestaurantRegister = lazy(() => import("../pages/Auth/RestaurantRegister"));
const RestaurantArticlesPage = lazy(() => import("../pages/RestaurantArticlesPage.jsx"));
const RestaurantProfilePage = lazy(() => import("../pages/Restaurant/RestaurantProfilePage.jsx"));
const RestaurantOrdersPage = lazy(() => import("../pages/Restaurant/RestaurantOrdersPage.jsx"));
const RestaurantBookingsPage = lazy(() => import("../pages/Restaurant/RestaurantBookingsPage.jsx"));

const UserProfilePage = lazy(() => import("../pages/User/UserProfilePage.jsx"));
const UserOrdersPage = lazy(() => import("../pages/User/UserOrdersPage.jsx"));
const UserReservationsPage = lazy(() => import("../pages/User/UserReservationsPage.jsx"));
const UserCartPage = lazy(() => import("../pages/User/UserCartPage.jsx"));

export const router = createBrowserRouter([
  {
    element: <PublicHeaderLayout />,
    errorElement: <Suspense fallback={<LoadingFallback />}><ErrorPage /></Suspense>,
    children: [
      {
        path: "/",
        element: <Suspense fallback={<LoadingFallback />}><HomeHandler /></Suspense>,
      },
      {
        path: "/restaurants/:restaurantId/articles",
        element: <Suspense fallback={<LoadingFallback />}><RestaurantArticlesPage /></Suspense>,
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
      {
        path: "/restaurant/profile",
        element: (
          <RestaurantRoute>
            <Suspense fallback={<LoadingFallback />}>
              <RestaurantProfilePage />
            </Suspense>
          </RestaurantRoute>
        ),
      },
      {
        path: "/restaurant/orders",
        element: (
          <RestaurantRoute>
            <Suspense fallback={<LoadingFallback />}>
              <RestaurantOrdersPage />
            </Suspense>
          </RestaurantRoute>
        ),
      },
      {
        path: "/restaurant/bookings",
        element: (
          <RestaurantRoute>
            <Suspense fallback={<LoadingFallback />}>
              <RestaurantBookingsPage />
            </Suspense>
          </RestaurantRoute>
        ),
      },
      {
        path: "/restaurant/articles",
        element: (
          <RestaurantRoute>
            <Suspense fallback={<LoadingFallback />}>
              <RestaurantArticlesPage />
            </Suspense>
          </RestaurantRoute>
        ),
      },
      {
        path: "/user/profile",
        element: (
          <UserRoute>
            <Suspense fallback={<LoadingFallback />}>
              <UserProfilePage />
            </Suspense>
          </UserRoute>
        ),
      },
      {
        path: "/user/orders",
        element: (
          <UserRoute>
            <Suspense fallback={<LoadingFallback />}>
              <UserOrdersPage />
            </Suspense>
          </UserRoute>
        ),
      },
      {
        path: "/user/reservations",
        element: (
          <UserRoute>
            <Suspense fallback={<LoadingFallback />}>
              <UserReservationsPage />
            </Suspense>
          </UserRoute>
        ),
      },
      {
        path: "/cart",
        element: (
          <UserRoute>
            <Suspense fallback={<LoadingFallback />}>
              <UserCartPage />
            </Suspense>
          </UserRoute>
        ),
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