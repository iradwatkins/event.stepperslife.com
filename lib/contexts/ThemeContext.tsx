'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Theme variable structure matching globals.css
export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  'card-foreground': string;
  popover: string;
  'popover-foreground': string;
  primary: string;
  'primary-foreground': string;
  secondary: string;
  'secondary-foreground': string;
  muted: string;
  'muted-foreground': string;
  accent: string;
  'accent-foreground': string;
  destructive: string;
  'destructive-foreground': string;
  border: string;
  input: string;
  ring: string;
  'chart-1': string;
  'chart-2': string;
  'chart-3': string;
  'chart-4': string;
  'chart-5': string;
  sidebar: string;
  'sidebar-foreground': string;
  'sidebar-primary': string;
  'sidebar-primary-foreground': string;
  'sidebar-accent': string;
  'sidebar-accent-foreground': string;
  'sidebar-border': string;
  'sidebar-ring': string;
}

export interface TypographySettings {
  'font-sans': string;
  'font-serif': string;
  'font-mono': string;
  'font-weight-light': number;
  'font-weight-regular': number;
  'font-weight-medium': number;
  'font-weight-semibold': number;
  'font-weight-bold': number;
  'letter-spacing': string;
  'line-height': string;
  'font-size-base': string;
}

export interface ThemeConfig {
  light: ThemeColors;
  dark: ThemeColors;
  typography: TypographySettings;
  other: {
    radius: string;
  };
}

interface ThemeHistory {
  timestamp: number;
  config: ThemeConfig;
  description: string;
}

interface ThemeContextType {
  theme: ThemeConfig;
  updateTheme: (mode: 'light' | 'dark', colors: Partial<ThemeColors>) => void;
  updateTypography: (fonts: Partial<ThemeConfig['typography']>) => void;
  updateRadius: (radius: string) => void;
  resetTheme: () => void;
  importTheme: (config: ThemeConfig) => void;
  exportTheme: () => string;
  exportThemeJSON: () => string;
  currentMode: 'light' | 'dark';
  setCurrentMode: (mode: 'light' | 'dark') => void;
  history: ThemeHistory[];
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isModified: boolean;
  saveTheme: (name: string) => void;
  savedThemes: { name: string; config: ThemeConfig; savedAt: number }[];
  loadSavedTheme: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Default theme matching tweakcn.com theme (cmffm3zz1000004la9lfv4eke) - Using HEX for better compatibility
const defaultTheme: ThemeConfig = {
  light: {
    background: '#ffffff',
    foreground: '#0f1419',
    card: '#f7f8f8',
    'card-foreground': '#0f1419',
    popover: '#ffffff',
    'popover-foreground': '#0f1419',
    primary: '#1e9df1',
    'primary-foreground': '#ffffff',
    secondary: '#0f1419',
    'secondary-foreground': '#ffffff',
    muted: '#e5e5e6',
    'muted-foreground': '#0f1419',
    accent: '#e3ecf6',
    'accent-foreground': '#1e9df1',
    destructive: '#f4212e',
    'destructive-foreground': '#ffffff',
    border: '#e1eaef',
    input: '#f7f9fa',
    ring: '#1da1f2',
    'chart-1': '#1e9df1',
    'chart-2': '#00b87a',
    'chart-3': '#f7b928',
    'chart-4': '#17bf63',
    'chart-5': '#e0245e',
    sidebar: '#f7f8f8',
    'sidebar-foreground': '#0f1419',
    'sidebar-primary': '#1e9df1',
    'sidebar-primary-foreground': '#ffffff',
    'sidebar-accent': '#e3ecf6',
    'sidebar-accent-foreground': '#1e9df1',
    'sidebar-border': '#e1e8ed',
    'sidebar-ring': '#1da1f2',
  },
  dark: {
    background: '#000000',
    foreground: '#e7e9ea',
    card: '#17181c',
    'card-foreground': '#d9d9d9',
    popover: '#000000',
    'popover-foreground': '#e7e9ea',
    primary: '#1c9cf0',
    'primary-foreground': '#ffffff',
    secondary: '#f0f3f4',
    'secondary-foreground': '#0f1419',
    muted: '#181818',
    'muted-foreground': '#72767a',
    accent: '#061622',
    'accent-foreground': '#1c9cf0',
    destructive: '#f4212e',
    'destructive-foreground': '#ffffff',
    border: '#242628',
    input: '#22303c',
    ring: '#1da1f2',
    'chart-1': '#1e9df1',
    'chart-2': '#00b87a',
    'chart-3': '#f7b928',
    'chart-4': '#17bf63',
    'chart-5': '#e0245e',
    sidebar: '#17181c',
    'sidebar-foreground': '#d9d9d9',
    'sidebar-primary': '#1da1f2',
    'sidebar-primary-foreground': '#ffffff',
    'sidebar-accent': '#061622',
    'sidebar-accent-foreground': '#1c9cf0',
    'sidebar-border': '#38444d',
    'sidebar-ring': '#1da1f2',
  },
  typography: {
    'font-sans': 'Open Sans, sans-serif',
    'font-serif': 'Georgia, serif',
    'font-mono': 'Menlo, monospace',
    'font-weight-light': 300,
    'font-weight-regular': 400,
    'font-weight-medium': 500,
    'font-weight-semibold': 600,
    'font-weight-bold': 700,
    'letter-spacing': '0em',
    'line-height': '1.5',
    'font-size-base': '16px',
  },
  other: {
    radius: '1.3rem',
  },
};

// Theme version - increment to force clear old cached themes
const THEME_VERSION = '4.0.0';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);
  const [currentMode, setCurrentMode] = useState<'light' | 'dark'>('light');
  const [history, setHistory] = useState<ThemeHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedThemes, setSavedThemes] = useState<{ name: string; config: ThemeConfig; savedAt: number }[]>([]);

  // Load theme from localStorage on mount
  useEffect(() => {
    // AGGRESSIVELY clear ALL theme-related caches
    console.log('🧹 Clearing ALL theme caches and forcing fresh theme...');

    // Clear all theme-related localStorage items
    localStorage.removeItem('customTheme');
    localStorage.removeItem('themeVersion');
    localStorage.removeItem('theme-mode');
    localStorage.removeItem('theme-config');

    // Force set new version and default theme
    localStorage.setItem('themeVersion', THEME_VERSION);
    setTheme(defaultTheme);

    // Clear any cached CSS variables by forcing reapplication
    const root = document.documentElement;
    root.style.cssText = '';

    console.log('✅ Theme cache cleared - using default tweakcn.com theme');

    // Load saved themes list (but not the active theme)
    const savedThemesList = localStorage.getItem('savedThemes');
    if (savedThemesList) {
      try {
        setSavedThemes(JSON.parse(savedThemesList));
      } catch (e) {
        console.error('Failed to load saved themes list:', e);
      }
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const colors = theme[currentMode];

    // Apply colors
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    // Apply typography
    Object.entries(theme.typography).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, String(value));
    });

    // Apply other settings
    root.style.setProperty('--radius', theme.other.radius);

    // Save to localStorage with version
    localStorage.setItem('customTheme', JSON.stringify(theme));
    localStorage.setItem('themeVersion', THEME_VERSION);
  }, [theme, currentMode]);

  const addToHistory = (description: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      timestamp: Date.now(),
      config: JSON.parse(JSON.stringify(theme)),
      description,
    });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Limit history to 50 items
    if (newHistory.length > 50) {
      setHistory(newHistory.slice(-50));
      setHistoryIndex(49);
    }
  };

  const updateTheme = (mode: 'light' | 'dark', colors: Partial<ThemeColors>) => {
    setTheme(prev => ({
      ...prev,
      [mode]: { ...prev[mode], ...colors },
    }));
    addToHistory(`Updated ${mode} mode colors`);
  };

  const updateTypography = (fonts: Partial<ThemeConfig['typography']>) => {
    setTheme(prev => ({
      ...prev,
      typography: { ...prev.typography, ...fonts },
    }));
    addToHistory('Updated typography');
  };

  const updateRadius = (radius: string) => {
    setTheme(prev => ({
      ...prev,
      other: { ...prev.other, radius },
    }));
    addToHistory('Updated border radius');
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
    addToHistory('Reset to default theme');
  };

  const importTheme = (config: ThemeConfig) => {
    setTheme(config);
    addToHistory('Imported theme');
  };

  const exportTheme = (): string => {
    const light = theme.light;
    const dark = theme.dark;

    let css = `@layer base {\n  :root {\n`;
    Object.entries(light).forEach(([key, value]) => {
      css += `    --${key}: ${value};\n`;
    });
    Object.entries(theme.typography).forEach(([key, value]) => {
      css += `    --${key}: ${value};\n`;
    });
    css += `    --radius: ${theme.other.radius};\n`;
    css += `  }\n\n  .dark {\n`;
    Object.entries(dark).forEach(([key, value]) => {
      css += `    --${key}: ${value};\n`;
    });
    Object.entries(theme.typography).forEach(([key, value]) => {
      css += `    --${key}: ${value};\n`;
    });
    css += `    --radius: ${theme.other.radius};\n`;
    css += `  }\n}\n`;

    return css;
  };

  const exportThemeJSON = (): string => {
    return JSON.stringify(theme, null, 2);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevConfig = history[historyIndex - 1];
      if (prevConfig) {
        setHistoryIndex(historyIndex - 1);
        setTheme(prevConfig.config);
      }
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextConfig = history[historyIndex + 1];
      if (nextConfig) {
        setHistoryIndex(historyIndex + 1);
        setTheme(nextConfig.config);
      }
    }
  };

  const saveTheme = (name: string) => {
    const newSaved = {
      name,
      config: JSON.parse(JSON.stringify(theme)),
      savedAt: Date.now(),
    };
    const updated = [...savedThemes, newSaved];
    setSavedThemes(updated);
    localStorage.setItem('savedThemes', JSON.stringify(updated));
  };

  const loadSavedTheme = (name: string) => {
    const saved = savedThemes.find(t => t.name === name);
    if (saved) {
      importTheme(saved.config);
    }
  };

  const isModified = JSON.stringify(theme) !== JSON.stringify(defaultTheme);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        updateTheme,
        updateTypography,
        updateRadius,
        resetTheme,
        importTheme,
        exportTheme,
        exportThemeJSON,
        currentMode,
        setCurrentMode,
        history,
        undo,
        redo,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
        isModified,
        saveTheme,
        savedThemes,
        loadSavedTheme,
      }}
    >
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
