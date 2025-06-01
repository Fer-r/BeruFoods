import { router } from "./router";
import { RouterProvider } from "react-router";
import { useThemeManager } from "./hooks/useThemeManager";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ModalProvider } from "./context/ModalContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { Toaster } from "sonner";

const App = () => {
  useThemeManager();

  return (
    <AuthProvider>
      <ModalProvider>
        <CartProvider>
          <NotificationProvider>
            <RouterProvider router={router} />
            <Toaster 
              position="top-right"
              expand={true}
              richColors={true}
              closeButton={true}
            />
          </NotificationProvider>
        </CartProvider>
      </ModalProvider>
    </AuthProvider>
  );
};

export default App;