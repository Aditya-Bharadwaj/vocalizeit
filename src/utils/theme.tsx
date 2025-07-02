import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { StorageService } from './storage';

export interface Theme {
  colors: {
    background: string;
    surface: string;
    primary: string;
    text: string;
    textSecondary: string;
    border: string;
    critical: string;
    success: string;
    warning: string;
    accent: string;
  };
  isDark: boolean;
}

export const lightTheme: Theme = {
  colors: {
    background: '#f9fafb',
    surface: '#ffffff',
    primary: '#3b82f6',
    text: '#111827',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    critical: '#ef4444',
    success: '#16a34a',
    warning: '#f59e0b',
    accent: '#8b5cf6',
  },
  isDark: false,
};

export const darkTheme: Theme = {
  colors: {
    background: '#111827',
    surface: '#1f2937',
    primary: '#60a5fa',
    text: '#f9fafb',
    textSecondary: '#9ca3af',
    border: '#374151',
    critical: '#f87171',
    success: '#4ade80',
    warning: '#fbbf24',
    accent: '#a78bfa',
  },
  isDark: true,
};

export const amoledTheme: Theme = {
  colors: {
    background: '#000000',
    surface: '#121212',
    primary: '#60a5fa',
    text: '#ffffff',
    textSecondary: '#9ca3af',
    border: '#2d2d2d',
    critical: '#ff6b6b',
    success: '#51cf66',
    warning: '#ffd43b',
    accent: '#b197fc',
  },
  isDark: true,
};

interface ThemeContextType {
  theme: Theme;
  themeName: string;
  setTheme: (themeName: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children?: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeName, setThemeName] = useState<string>('system');
  const [theme, setTheme] = useState<Theme>(lightTheme);

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    applyTheme(themeName);
  }, [themeName, systemColorScheme]);

  const loadTheme = async () => {
    try {
      const settings = await StorageService.getSettings();
      setThemeName(settings.theme);
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const applyTheme = (selectedTheme: string) => {
    let newTheme: Theme;
    
    switch (selectedTheme) {
      case 'light':
        newTheme = lightTheme;
        break;
      case 'dark':
        newTheme = darkTheme;
        break;
      case 'amoled':
        newTheme = amoledTheme;
        break;
      case 'system':
      default:
        newTheme = systemColorScheme === 'dark' ? darkTheme : lightTheme;
        break;
    }
    
    setTheme(newTheme);
  };

  const handleSetTheme = async (newThemeName: string) => {
    try {
      const settings = await StorageService.getSettings();
      await StorageService.saveSettings({ ...settings, theme: newThemeName as 'light' | 'dark' | 'system' | 'amoled' });
      setThemeName(newThemeName);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
} 