import { useState, useEffect, useCallback } from 'react';
import { themeChange } from 'theme-change';

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

  const changeTheme = useCallback((newTheme) => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme); // Ensure localStorage is updated
      setTheme(newTheme); // Update React state
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    changeTheme(newTheme);
  }, [theme, changeTheme]);

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