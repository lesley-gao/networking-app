import React, { createContext, useContext, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setTheme, toggleTheme } from '../store/slices/uiSlice';

// Theme context for additional functionality
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  muiTheme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const AppThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector((state) => state.ui.theme);

  // Detect system preference on initial load
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    
    if (!storedTheme) {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      dispatch(setTheme(prefersDark ? 'dark' : 'light'));
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        dispatch(setTheme(e.matches ? 'dark' : 'light'));
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [dispatch]);

  // Update document class for Tailwind dark mode
  useEffect(() => {
    const root = document.documentElement;
    if (currentTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [currentTheme]);

  // Create MUI theme based on current theme
  const muiTheme = createTheme({
    palette: {
      mode: currentTheme,
      primary: {
        main: currentTheme === 'dark' ? '#90caf9' : '#1976d2',
        light: currentTheme === 'dark' ? '#bbdefb' : '#42a5f5',
        dark: currentTheme === 'dark' ? '#64b5f6' : '#1565c0',
      },
      secondary: {
        main: currentTheme === 'dark' ? '#f48fb1' : '#e91e63',
        light: currentTheme === 'dark' ? '#f8bbd9' : '#ec407a',
        dark: currentTheme === 'dark' ? '#f06292' : '#c2185b',
      },
      background: {
        default: currentTheme === 'dark' ? '#121212' : '#ffffff',
        paper: currentTheme === 'dark' ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: currentTheme === 'dark' ? '#ffffff' : '#000000',
        secondary: currentTheme === 'dark' ? '#b0b0b0' : '#666666',
      },
    },
    typography: {
      fontFamily: ['Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(','),
      h1: {
        fontWeight: 600,
      },
      h2: {
        fontWeight: 600,
      },
      h3: {
        fontWeight: 500,
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: currentTheme === 'dark' 
              ? '0 4px 20px rgba(0,0,0,0.3)' 
              : '0 2px 12px rgba(0,0,0,0.08)',
          },
        },
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            paddingLeft: '16px',
            paddingRight: '16px',
            '@media (min-width: 600px)': {
              paddingLeft: '24px',
              paddingRight: '24px',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: currentTheme === 'dark' ? '#1e1e1e' : '#1976d2',
            color: '#ffffff',
          },
        },
      },
    },
  });

  const handleToggleTheme = () => {
    dispatch(toggleTheme());
  };

  const contextValue: ThemeContextType = {
    theme: currentTheme,
    toggleTheme: handleToggleTheme,
    muiTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};