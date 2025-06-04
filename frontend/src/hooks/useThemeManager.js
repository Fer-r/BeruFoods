import { useState, useEffect, useCallback } from 'react';
import { themeChange } from 'theme-change';

/**
 * @typedef {'light' | 'dark'} Theme
 */

/**
 * Manages the application's theme state, allowing for switching between themes
 * and persisting the selected theme using `localStorage`.
 * It initializes the theme from `localStorage` or defaults to 'light'.
 * It also uses the `theme-change` library to apply theme changes to the DOM.
 *
 * @returns {object} An object containing the current theme state and theme management functions.
 * @property {Theme} theme - The current theme state ('light' or 'dark').
 * @property {function(Theme): void} changeTheme - Function to change the current theme.
 * @property {function(): void} toggleTheme - Function to toggle between 'light' and 'dark' themes.
 * @property {function(): Theme} getCurrentTheme - Function to get the current theme.
 * @property {Theme[]} availableThemes - Array of available themes.
 */
export const useThemeManager = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light'; // Initialize from localStorage or default
    }
    return 'light'; // Default for SSR or non-browser environments
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    themeChange(false); 

    const initialTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', initialTheme);
    if (theme !== initialTheme) {
      setTheme(initialTheme); // Sync state if it was somehow different
    }

  }, []);

  /**
   * Changes the current theme to the specified theme.
   * Updates the `data-theme` attribute on the document element,
   * persists the new theme in `localStorage`, and updates the React state.
   *
   * @param {Theme} newTheme - The new theme to apply ('light' or 'dark').
   */
  const changeTheme = useCallback((newTheme) => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme); // Ensure localStorage is updated
      setTheme(newTheme); // Update React state
    }
  }, []);

  /**
   * Toggles the current theme between 'light' and 'dark'.
   * It determines the new theme based on the current theme and calls `changeTheme`.
   */
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    changeTheme(newTheme);
  }, [theme, changeTheme]);

  /**
   * Returns the current theme.
   *
   * @returns {Theme} The current theme ('light' or 'dark').
   */
  const getCurrentTheme = useCallback(() => {
    return theme;
  }, [theme]);

  return {
    theme,
    changeTheme,
    toggleTheme,
    getCurrentTheme,
    availableThemes: ['light', 'dark'], // Assuming these are your DaisyUI themes
  };
};