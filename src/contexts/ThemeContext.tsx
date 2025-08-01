import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isDashboardOrAdmin = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin');
  const isLandingPage = location.pathname === '/';
  
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      // Force light mode for landing page immediately
      if (window.location.pathname === '/') {
        return "light";
      }
      const savedTheme = localStorage.getItem("theme") as Theme;
      if (savedTheme) return savedTheme;
    }
    return "light"; // Default to light
  });

  // Force dark theme for dashboard and admin routes, force light for landing page
  useEffect(() => {
    if (isDashboardOrAdmin) {
      setTheme("dark");
    } else if (isLandingPage) {
      setTheme("light");
    }
  }, [isDashboardOrAdmin, isLandingPage]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    
    // Save theme to localStorage only if not on dashboard/admin or landing page (since they have forced themes)
    if (!isDashboardOrAdmin && !isLandingPage) {
      localStorage.setItem("theme", theme);
    }
  }, [theme, isDashboardOrAdmin, isLandingPage]);

  const toggleTheme = () => {
    // Disable theme toggle on landing page and dashboard/admin routes
    if (isLandingPage || isDashboardOrAdmin) return;
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}