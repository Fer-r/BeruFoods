import { router } from "./router";
import { RouterProvider } from "react-router"; // Correct import
import { useThemeManager } from "./hooks/useThemeManager"; // Import the hook
import { AuthProvider } from "./context/AuthContext.jsx"; // Import AuthProvider

const App = () => {
  useThemeManager(); // Call the hook to activate global theme management

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default App;
