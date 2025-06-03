import { FaSun, FaMoon } from 'react-icons/fa6';
import { useThemeManager } from '../../../../hooks/useThemeManager';

const ThemeToggleButton = () => {
  const { theme, changeTheme} = useThemeManager();

  const handleThemeSelection = (newTheme) => {
    changeTheme(newTheme);
  };

  const getIcon = () => {
    if (theme === 'light') return <FaSun className="h-5 w-5" />;
    return <FaMoon className="h-5 w-5" />;
  };

  const getTooltipContent = () => {
    return `Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)} (Click to change)`;
  };

  const getCurrentThemeLabel = () => {
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  };

  const themeOptions = [
    { name: 'light', icon: FaSun, label: 'Light' },
    { name: 'dark', icon: FaMoon, label: 'Dark' },
  ];

  return (
    <div className="dropdown dropdown-top dropdown-end">
      <button
        tabIndex={0}
        type="button"
        className="btn flex items-center w-full gap-2"
        title={getTooltipContent()}
      >
        {getIcon()}
        <span className="text-sm font-medium hidden sm:inline">{getCurrentThemeLabel()}</span>
      </button>
      <ul
        tabIndex={0}
        className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
      >
        {themeOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <li key={option.name}>
              <button
                onClick={() => handleThemeSelection(option.name)}
                className={`btn btn-sm btn-block btn-ghost justify-start ${theme === option.name ? 'btn-active' : ''}`}
              >
                <IconComponent className="inline-block w-4 h-4 mr-2 stroke-current" /> {option.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ThemeToggleButton; 