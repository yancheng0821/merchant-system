import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'colorful' | 'monochrome';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  getMenuColor: (originalColor?: string) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_MODE_KEY = 'themeMode';
const MONOCHROME_COLOR = '#1a1a1a';

export const AppThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_MODE_KEY);
    return (saved as ThemeMode) || 'colorful';
  });

  useEffect(() => {
    localStorage.setItem(THEME_MODE_KEY, themeMode);
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const getMenuColor = (originalColor?: string): string => {
    if (themeMode === 'monochrome') {
      return MONOCHROME_COLOR;
    }
    return originalColor || '#6366F1';
  };

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, getMenuColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
