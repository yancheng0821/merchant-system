import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NavigationContextType {
  isDrawerOpen: boolean;
  toggleDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const DRAWER_STATE_KEY = 'drawerState';

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 从localStorage读取初始状态，默认为true
  const [isDrawerOpen, setIsDrawerOpen] = useState(() => {
    const saved = localStorage.getItem(DRAWER_STATE_KEY);
    return saved !== null ? JSON.parse(saved) : true;
  });

  // 当状态改变时保存到localStorage
  useEffect(() => {
    localStorage.setItem(DRAWER_STATE_KEY, JSON.stringify(isDrawerOpen));
  }, [isDrawerOpen]);

  const toggleDrawer = () => {
    setIsDrawerOpen((prev: boolean) => !prev);
  };

  const setDrawerOpen = (open: boolean) => {
    setIsDrawerOpen(open);
  };

  return (
    <NavigationContext.Provider value={{ isDrawerOpen, toggleDrawer, setDrawerOpen }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
