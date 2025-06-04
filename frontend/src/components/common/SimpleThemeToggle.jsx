import { FaSun, FaMoon } from 'react-icons/fa6';
import { useThemeManager } from '../../hooks/useThemeManager';

/**
 * SimpleThemeToggle provides a UI element to toggle between light and dark themes.
 * It utilizes the `useThemeManager` hook to access and update the current theme state.
 * The component can be rendered as a standalone icon button or as a menu item
 * with a text label and an icon, based on the `inMenu` prop.
 *
 * @param {object} props - The component's props.
 * @param {string} [props.className=""] - Additional CSS classes for the main container, primarily used when `inMenu` is false (standalone mode).
 * @param {boolean} [props.inMenu=false] - If true, renders the toggle in a style suitable for a menu item (text label + icon). Otherwise, renders as a standalone icon button.
 */
const SimpleThemeToggle = ({ className = "", inMenu = false }) => {
  const { theme, toggleTheme } = useThemeManager();

  const handleThemeToggle = () => {
    toggleTheme();
  };

  if (inMenu) {
    return (
      <div 
        onClick={handleThemeToggle}
        className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-base-200 rounded-lg"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        <span>Theme</span>
        {theme === 'dark' ? (
          <FaMoon className="h-5 w-5" />
        ) : (
          <FaSun className="h-5 w-5" />
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {theme === 'dark' ? (
        <FaMoon 
          onClick={handleThemeToggle}
          className="h-8 w-8 p-2 rounded-lg bg-base-300 hover:bg-base-200 cursor-pointer border border-base-content/20 transition-colors"
          title="Switch to light theme"
        />
      ) : (
        <FaSun 
          onClick={handleThemeToggle}
          className="h-8 w-8 p-2 rounded-lg bg-base-300 hover:bg-base-200 cursor-pointer border border-base-content/20 transition-colors"
          title="Switch to dark theme"
        />
      )}
    </div>
  );
};

export default SimpleThemeToggle; 