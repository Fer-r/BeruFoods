import { FaSun, FaMoon, FaGear } from 'react-icons/fa6';
import { useThemeManager } from '../../../hooks/useThemeManager';

const ThemeToggleButton = () => {
  const [themePreference, setThemePreference] = useThemeManager();

  const handleThemeSelection = (newTheme) => {
    setThemePreference(newTheme);
  };

  const getIcon = () => {
    let currentDisplayTheme = themePreference;
    if (themePreference === 'system') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      currentDisplayTheme = isSystemDark ? 'dark' : 'light';
    }

    // Icon for the button itself based on current actual theme or system icon
    if (themePreference === 'system') return <FaGear className="h-5 w-5" />;
    if (currentDisplayTheme === 'light') return <FaSun className="h-5 w-5" />;
    return <FaMoon className="h-5 w-5" />;
  };

  const getTooltipContent = () => {
    switch (themePreference) {
      case 'light':
        return 'Theme: Light (Click to change)';
      case 'dark':
        return 'Theme: Dark (Click to change)';
      case 'system':
      default:
        return 'Theme: System (Click to change)';
    }
  };

  const getCurrentThemeLabel = () => {
    // Label always reflects the preference (Light, Dark, or System)
    switch (themePreference) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
      default:
        return 'System';
    }
  };

  const themeOptions = [
    { name: 'light', icon: FaSun, label: 'Light' },
    { name: 'dark', icon: FaMoon, label: 'Dark' },
    { name: 'system', icon: FaGear, label: 'System' },
  ];

  return (
    <>
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
        className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-52"
      >
        {themeOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <li key={option.name}>
              <button
                onClick={() => handleThemeSelection(option.name)}
                className={`btn btn-sm btn-block btn-ghost justify-start ${themePreference === option.name ? 'btn-active' : ''}`}
              >
                <IconComponent className="inline-block w-4 h-4 mr-2 stroke-current" /> {option.label}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
};

export default ThemeToggleButton; 