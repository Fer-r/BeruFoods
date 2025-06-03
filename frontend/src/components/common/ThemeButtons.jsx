import { FaSun, FaMoon } from 'react-icons/fa6';
import { useThemeManager } from '../../hooks/useThemeManager';

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