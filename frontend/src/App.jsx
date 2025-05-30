import { router } from "./router";
import { RouterProvider } from "react-router";
import { useThemeManager } from "./hooks/useThemeManager";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ModalProvider } from "./context/ModalContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import GlobalNotifications from "./components/GlobalNotifications";

const App = () => {
  useThemeManager();

  return (
    <AuthProvider>
      <ModalProvider>
        <CartProvider>
          <GlobalNotifications />
          <RouterProvider router={router} />
        </CartProvider>
      </ModalProvider>
    </AuthProvider>
  );
};

export default App;