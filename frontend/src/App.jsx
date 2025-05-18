import { router } from "./router";
import { RouterProvider } from "react-router"; // Correct import
import { useThemeManager } from "./hooks/useThemeManager"; // Import the hook
import { AuthProvider } from "./context/AuthContext.jsx"; // Import AuthProvider
import { ModalProvider } from "./context/ModalContext.jsx"; // Import ModalProvider
import { CartProvider } from "./context/CartContext.jsx";

const App = () => {
  useThemeManager(); // Call the hook to activate global theme management

  return (
    <AuthProvider>
      <ModalProvider>
        <CartProvider>
        <RouterProvider router={router} />
        </CartProvider>
      </ModalProvider>
    </AuthProvider>
  );
};

export default App;
