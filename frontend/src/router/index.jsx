import { createBrowserRouter } from "react-router";
import { Suspense, lazy } from 'react';
import PublicHeaderLayout from "../layouts/PublicHeaderLayout.jsx";
import MinimalLayout from "../layouts/MinimalLayout";
import AuthLayout from "../layouts/AuthLayout.jsx";
import LoadingFallback from "../components/common/LoadingFallback.jsx";
import { RestaurantRoute, UserRoute } from "./ProtectedRoutes.jsx";

// Page Components
const ErrorPage = lazy(() => import("../pages/ErrorPage.jsx"));
const HomeHandler = lazy(() => import("../pages/HomeHandler.jsx"));
const UserRegister = lazy(() => import("../pages/auth/UserRegister.jsx"));
const RestaurantLogin = lazy(() => import("../pages/auth/RestaurantLogin.jsx"));
const RestaurantDashboard = lazy(() => import("../pages/restaurant/RestaurantDashboard.jsx"));
const RestaurantRedirect = lazy(() => import("../pages/auth/RestaurantRedirect.jsx"));
const RestaurantRegister = lazy(() => import("../pages/auth/RestaurantRegister.jsx"));
const RestaurantMenuPage = lazy(() => import("../pages/restaurant/RestaurantMenuPage.jsx"));
const RestaurantProfilePage = lazy(() => import("../pages/restaurant/RestaurantProfilePage.jsx"));
const RestaurantOrdersPage = lazy(() => import("../pages/restaurant/RestaurantOrdersPage.jsx"));
const RestaurantOrderDetailsPage = lazy(() => import("../pages/restaurant/RestaurantOrderDetailsPage.jsx"));
const RestaurantBookingsPage = lazy(() => import("../pages/restaurant/RestaurantBookingsPage.jsx"));
const RestaurantArticlesManagementPage = lazy(() => import("../pages/restaurant/RestaurantArticlesManagementPage.jsx"));
const ArticleFormPage = lazy(() => import("../pages/restaurant/ArticleFormPage.jsx"));
const UserProfilePage = lazy(() => import("../pages/user/UserProfilePage.jsx"));
const UserOrdersPage = lazy(() => import("../pages/user/UserOrdersPage.jsx"));
const UserReservationsPage = lazy(() => import("../pages/user/UserReservationsPage.jsx"));
const UserCartPage = lazy(() => import("../pages/cart/UserCartPage.jsx"));
const OrderDetailsPage = lazy(() => import("../pages/user/./UserOrderDetailsPage"));

const PATHS = {
  ROOT: "/",
  RESTAURANTS_ARTICLES_SLUG: "/restaurants/:restaurantId/articles",
  RESTAURANT_DASHBOARD: "/restaurant/dashboard",
  RESTAURANT_PROFILE: "/restaurant/profile",
  RESTAURANT_ORDERS: "/restaurant/orders",
  RESTAURANT_ORDER_DETAILS: "/restaurant/orders/:orderId",
  RESTAURANT_BOOKINGS: "/restaurant/bookings",
  RESTAURANT_ARTICLES: "/restaurant/articles",
  RESTAURANT_ARTICLES_NEW: "/restaurant/articles/new",
  RESTAURANT_ARTICLES_EDIT: "/restaurant/articles/:articleId/edit",
  RESTAURANT_ROOT: "/restaurant",
  RESTAURANT_REGISTER: "/restaurant/register",
  RESTAURANT_LOGIN: "/restaurant/login",
  USER_PROFILE: "/user/profile",
  USER_ORDERS: "/user/orders",
  USER_ORDER_DETAILS: "/user/orders/:orderId",
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
        path: PATHS.USER_ORDER_DETAILS,
        element: renderProtectedPage(UserRoute, OrderDetailsPage),
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
        path: PATHS.RESTAURANT_ORDER_DETAILS,
        element: renderProtectedPage(RestaurantRoute, RestaurantOrderDetailsPage),
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