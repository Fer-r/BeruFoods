import { useThemeManager } from '../../hooks/useThemeManager';

const ThemeSelector = ({ 
  className = "select select-bordered w-full max-w-xs",
  themes = [
    { value: 'light', label: '☀️ Light' },
    { value: 'dark', label: '🌙 Dark' },
    // You can add more themes here when you create them
    // { value: 'cupcake', label: '🧁 Cupcake' },
    // { value: 'retro', label: '🕺 Retro' },
  ]
}) => {
  const { theme, changeTheme } = useThemeManager();

  const handleThemeChange = (event) => {
    changeTheme(event.target.value);
  };

  return (
    <select 
      className={className}
      value={theme}
      onChange={handleThemeChange}
      aria-label="Choose theme"
    >
      {themes.map((themeOption) => (
        <option key={themeOption.value} value={themeOption.value}>
          {themeOption.label}
        </option>
      ))}
    </select>
  );
};

export default ThemeSelector; 