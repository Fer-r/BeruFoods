import { useThemeManager } from '../../hooks/useThemeManager';

/**
 * ThemeSelector renders a dropdown select input that allows users to choose
 * from a list of available themes. It uses the `useThemeManager` hook to get the
 * current theme and to update the theme when a new option is selected.
 *
 * @param {object} props - The component's props.
 * @param {string} [props.className="select select-bordered w-full max-w-xs"] - CSS classes for the select element.
 * @param {Array<{value: string, label: string}>} [props.themes=[{ value: 'light', label: '☀️ Light' }, { value: 'dark', label: '🌙 Dark' }]] - An array of theme objects for the select options. Each object should have `value` (theme identifier, e.g., 'light') and `label` (display text in the dropdown, e.g., '☀️ Light').
 */
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