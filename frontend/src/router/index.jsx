import { createBrowserRouter } from "react-router";
import { Suspense, lazy } from 'react';
import PublicHeaderLayout from "../layout/PublicHeaderLayout.jsx";
import MinimalLayout from "../layout/MinimalLayout";
import AuthLayout from "../layout/AuthLayout.jsx";
import LoadingFallback from "../components/LoadingFallback.jsx";
import { RestaurantRoute, UserRoute } from "./ProtectedRoutes.jsx";

// Page Components
const ErrorPage = lazy(() => import("../pages/ErrorPage.jsx"));
const HomeHandler = lazy(() => import("../pages/HomeHandler.jsx"));
const UserRegister = lazy(() => import("../pages/Auth/UserRegister"));
const RestaurantLogin = lazy(() => import("../pages/Auth/RestaurantLogin.jsx"));
const RestaurantDashboard = lazy(() => import("../pages/Restaurant/RestaurantDashboard.jsx"));
const RestaurantRedirect = lazy(() => import("../pages/Auth/RestaurantRedirect.jsx"));
const RestaurantRegister = lazy(() => import("../pages/Auth/RestaurantRegister"));
const RestaurantMenuPage = lazy(() => import("../pages/RestaurantMenuPage.jsx"));
const RestaurantProfilePage = lazy(() => import("../pages/Restaurant/RestaurantProfilePage.jsx"));
const RestaurantOrdersPage = lazy(() => import("../pages/Restaurant/RestaurantOrdersPage.jsx"));
const RestaurantBookingsPage = lazy(() => import("../pages/Restaurant/RestaurantBookingsPage.jsx"));
const RestaurantArticlesManagementPage = lazy(() => import("../pages/Restaurant/RestaurantArticlesManagementPage.jsx"));
const ArticleFormPage = lazy(() => import("../pages/Restaurant/ArticleFormPage.jsx"));
const UserProfilePage = lazy(() => import("../pages/User/UserProfilePage.jsx"));
const UserOrdersPage = lazy(() => import("../pages/User/UserOrdersPage.jsx"));
const UserReservationsPage = lazy(() => import("../pages/User/UserReservationsPage.jsx"));
const UserCartPage = lazy(() => import("../pages/User/UserCartPage.jsx"));

const PATHS = {
  ROOT: "/",
  RESTAURANTS_ARTICLES_SLUG: "/restaurants/:restaurantId/articles",
  RESTAURANT_DASHBOARD: "/restaurant/dashboard",
  RESTAURANT_PROFILE: "/restaurant/profile",
  RESTAURANT_ORDERS: "/restaurant/orders",
  RESTAURANT_BOOKINGS: "/restaurant/bookings",
  RESTAURANT_ARTICLES: "/restaurant/articles",
  RESTAURANT_ARTICLES_NEW: "/restaurant/articles/new",
  RESTAURANT_ARTICLES_EDIT: "/restaurant/articles/:articleId/edit",
  RESTAURANT_ROOT: "/restaurant",
  RESTAURANT_REGISTER: "/restaurant/register",
  RESTAURANT_LOGIN: "/restaurant/login",
  USER_PROFILE: "/user/profile",
  USER_ORDERS: "/user/orders",
  USER_RESERVATIONS: "/user/reservations",
  USER_CART: "/cart",
  REGISTER: "/register",
};

const renderSuspendedPage = (LazyComponent, fallback = <LoadingFallback />) => (
  <Suspense fallback={fallback}>
    <LazyComponent />
  </Suspense>
);

const renderProtectedPage = (ProtectionComponent, LazyComponent, fallback = <LoadingFallback />) => (
  <ProtectionComponent>
    <Suspense fallback={fallback}>
      <LazyComponent />
    </Suspense>
  </ProtectionComponent>
);

export const router = createBrowserRouter([
  {
    element: <PublicHeaderLayout />,
    errorElement: renderSuspendedPage(ErrorPage),
    children: [
      // General Public Routes
      {
        path: PATHS.ROOT,
        element: renderSuspendedPage(HomeHandler),
      },
      {
        path: PATHS.RESTAURANTS_ARTICLES_SLUG,
        element: renderSuspendedPage(RestaurantMenuPage),
      },
      // User Routes (Protected)
      {
        path: PATHS.USER_PROFILE,
        element: renderProtectedPage(UserRoute, UserProfilePage),
      },
      {
        path: PATHS.USER_ORDERS,
        element: renderProtectedPage(UserRoute, UserOrdersPage),
      },
      {
        path: PATHS.USER_RESERVATIONS,
        element: renderProtectedPage(UserRoute, UserReservationsPage),
      },
      {
        path: PATHS.USER_CART,
        element: renderProtectedPage(UserRoute, UserCartPage),
      },
      // Restaurant Routes (Protected)
      {
        path: PATHS.RESTAURANT_DASHBOARD,
        element: renderProtectedPage(RestaurantRoute, RestaurantDashboard),
      },
      {
        path: PATHS.RESTAURANT_PROFILE,
        element: renderProtectedPage(RestaurantRoute, RestaurantProfilePage),
      },
      {
        path: PATHS.RESTAURANT_ORDERS,
        element: renderProtectedPage(RestaurantRoute, RestaurantOrdersPage),
      },
      {
        path: PATHS.RESTAURANT_BOOKINGS,
        element: renderProtectedPage(RestaurantRoute, RestaurantBookingsPage),
      },
      {
        path: PATHS.RESTAURANT_ARTICLES,
        element: renderProtectedPage(RestaurantRoute, RestaurantArticlesManagementPage),
      },
      // Restaurant Article Management Routes
      {
        path: PATHS.RESTAURANT_ARTICLES_NEW,
        element: renderProtectedPage(RestaurantRoute, ArticleFormPage),
      },
      {
        path: PATHS.RESTAURANT_ARTICLES_EDIT,
        element: renderProtectedPage(RestaurantRoute, ArticleFormPage),
      },
    ],
  },
  {
    element: <MinimalLayout />,
    errorElement: renderSuspendedPage(ErrorPage),
    children: [
      // Restaurant Routes
      {
        path: PATHS.RESTAURANT_ROOT,
        element: renderSuspendedPage(RestaurantRedirect),
      },
    ],
  },
  {
    element: <AuthLayout />,
    errorElement: renderSuspendedPage(ErrorPage),
    children: [
      // User Auth Routes
      {
        path: PATHS.REGISTER,
        element: renderSuspendedPage(UserRegister),
      },
      // Restaurant Auth Routes
      {
        path: PATHS.RESTAURANT_REGISTER,
        element: renderSuspendedPage(RestaurantRegister),
      },
      {
        path: PATHS.RESTAURANT_LOGIN,
        element: renderSuspendedPage(RestaurantLogin),
      },
    ],
  },
]);