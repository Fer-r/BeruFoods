import { useState, useEffect, useCallback } from 'react';

export const useThemeManager = () => {
  const [themePreference, setThemePreference] = useState(() => {
    // Initialize state from localStorage or default to 'system'
    return localStorage.getItem('themeMode') || 'system';
  });

  // Function to apply the theme based on preference or system setting
  const applyTheme = useCallback(() => {
    const root = window.document.documentElement;
    let effectiveTheme = themePreference;

    if (themePreference === 'system') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = isSystemDark ? 'dark' : 'light';
    }

    console.log(`[ThemeManager] Applying data-theme: ${effectiveTheme} (Preference: ${themePreference})`);
    root.setAttribute('data-theme', effectiveTheme);

  }, [themePreference]);

  // Apply theme on initial load and when preference changes
  useEffect(() => {
    applyTheme();
    // Persist the user's explicit preference when it changes
    localStorage.setItem('themeMode', themePreference);
  }, [themePreference, applyTheme]);

  // Listener for system changes ONLY when preference is 'system'
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemChange = () => {
      // We only care about system changes if the current preference *is* 'system'.
      // The themePreference state itself won't change here, but applyTheme needs to be called
      // to re-evaluate the effective theme based on the new system state.
      if (localStorage.getItem('themeMode') === 'system') {
        console.log('[ThemeManager] System theme changed, re-evaluating and applying...');
        applyTheme(); // applyTheme will re-check window.matchMedia
      }
    };

    if (themePreference === 'system') {
      mediaQuery.addEventListener('change', handleSystemChange);
      // Initial check in case the system theme changed while the listener wasn't active
      // (e.g., if preference was temporarily not 'system')
      applyTheme();
      return () => mediaQuery.removeEventListener('change', handleSystemChange);
    } else {
      // Clean up listener if preference is not 'system'
      mediaQuery.removeEventListener('change', handleSystemChange);
    }
    // This effect depends on themePreference to add/remove listener
    // and applyTheme to ensure it has the latest version of that function.
  }, [themePreference, applyTheme]);

  // Return the preference and the function to update it
  return [themePreference, setThemePreference];
}; 