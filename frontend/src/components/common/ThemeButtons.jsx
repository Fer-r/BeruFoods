import { FaSun, FaMoon } from 'react-icons/fa6';
import { useThemeManager } from '../../hooks/useThemeManager';

/**
 * ThemeButtons renders a set of buttons allowing the user to select from a list of available themes.
 * Each button typically includes an icon and a label, and indicates the currently active theme.
 * This component utilizes the `useThemeManager` hook to get the current theme and to change it.
 *
 * @param {object} props - The component's props.
 * @param {string} [props.layout='horizontal'] - Determines the layout of the buttons ('horizontal' or 'vertical').
 * @param {string} [props.size='btn-sm'] - The size class for the buttons (e.g., 'btn-xs', 'btn-sm', 'btn-md', 'btn-lg').
 * @param {Array<{name: string, label: string, icon: React.ComponentType}>} [props.themes=[{ name: 'light', label: 'Light', icon: FaSun }, { name: 'dark', label: 'Dark', icon: FaMoon }]] - An array of theme objects. Each object should have `name` (theme identifier, e.g., 'light'), `label` (display text, e.g., 'Light'), and `icon` (a React component for the icon, e.g., FaSun).
 */
const ThemeButtons = ({ 
  layout = 'horizontal', // 'horizontal' or 'vertical'
  size = 'btn-sm',
  themes = [
    { name: 'light', label: 'Light', icon: FaSun },
    { name: 'dark', label: 'Dark', icon: FaMoon },
  ]
}) => {
  const { theme, changeTheme } = useThemeManager();
  
  const handleThemeClick = (newTheme) => {
    changeTheme(newTheme);
  };

  const containerClass = layout === 'vertical' 
    ? 'flex flex-col gap-2' 
    : 'flex flex-wrap gap-2';

  return (
    <div className={containerClass}>
      {themes.map((themeOption) => {
        const IconComponent = themeOption.icon;
        const isActive = theme === themeOption.name;
        
        return (
          <button
            key={themeOption.name}
            onClick={() => handleThemeClick(themeOption.name)}
            className={`btn ${size} ${isActive ? 'btn-active' : 'btn-outline'} flex items-center gap-2`}
            aria-label={`Set ${themeOption.label} theme`}
          >
            {IconComponent && <IconComponent className="w-4 h-4" />}
            <span>{themeOption.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeButtons; 