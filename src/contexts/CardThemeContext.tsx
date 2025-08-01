import React, { createContext, useContext, useState, useEffect } from 'react';
import { CardConfig, defaultCardConfig } from '@/lib/cardConfig';

interface CardThemeContextType {
  globalConfig: CardConfig;
  updateGlobalConfig: (config: Partial<CardConfig>) => void;
  resetToDefaults: () => void;
  isLoading: boolean;
}

const CardThemeContext = createContext<CardThemeContextType | undefined>(undefined);

export function CardThemeProvider({ children }: { children: React.ReactNode }) {
  const [globalConfig, setGlobalConfig] = useState<CardConfig>(defaultCardConfig);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSavedConfig = () => {
      try {
        const saved = localStorage.getItem('universal-card-theme');
        if (saved) {
          const parsedConfig = JSON.parse(saved);
          setGlobalConfig({ ...defaultCardConfig, ...parsedConfig });
        }
      } catch (error) {
        console.error('Failed to load card theme configuration:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedConfig();
  }, []);

  const updateGlobalConfig = (updates: Partial<CardConfig>) => {
    const newConfig = { ...globalConfig, ...updates };
    setGlobalConfig(newConfig);
    
    try {
      localStorage.setItem('universal-card-theme', JSON.stringify(newConfig));
    } catch (error) {
      console.error('Failed to save card theme configuration:', error);
    }
  };

  const resetToDefaults = () => {
    setGlobalConfig(defaultCardConfig);
    localStorage.removeItem('universal-card-theme');
  };

  return (
    <CardThemeContext.Provider value={{
      globalConfig,
      updateGlobalConfig,
      resetToDefaults,
      isLoading
    }}>
      {children}
    </CardThemeContext.Provider>
  );
}

export function useCardTheme() {
  const context = useContext(CardThemeContext);
  if (context === undefined) {
    throw new Error('useCardTheme must be used within a CardThemeProvider');
  }
  return context;
}

// Optional hook for components that want to use card theme but don't require it
export function useOptionalCardTheme() {
  const context = useContext(CardThemeContext);
  return context || {
    globalConfig: defaultCardConfig,
    updateGlobalConfig: () => {},
    resetToDefaults: () => {},
    isLoading: false
  };
}