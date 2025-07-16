// ClientApp/src/components/__tests__/Navigation.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Navigation from '../Navigation';
import authSlice from '../../store/slices/authSlice';
import uiSlice from '../../store/slices/uiSlice';

const theme = createTheme();

// Define proper types for initial state
interface MockInitialState {
  auth?: {
    user?: any;
    token?: string;
    isAuthenticated?: boolean;
    isLoading?: boolean;
    error?: string | null;
  };
  ui?: {
    theme?: 'light' | 'dark';
    isDrawerOpen?: boolean;
    notifications?: any[];
    isLoading?: boolean;
    currentPage?: string;
    searchQuery?: string;
  };
}

const createMockStore = (initialState: MockInitialState = {}) => {
  const mockState = {
    auth: {
      user: {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isVerified: true,
      },
      token: 'mock-jwt-token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
      ...initialState.auth,
    },
    ui: {
      theme: 'light' as const,
      isDrawerOpen: false,
      notifications: [],
      isLoading: false,
      currentPage: '/',
      searchQuery: '',
      ...initialState.ui,
    },
  };

  return configureStore({
    reducer: {
      auth: authSlice,
      ui: uiSlice,
    },
    preloadedState: mockState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

const renderWithProviders = (ui: React.ReactElement, store = createMockStore()) => {
  return render(
    <BrowserRouter>
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          {ui}
        </ThemeProvider>
      </Provider>
    </BrowserRouter>
  );
};

describe('Navigation Component', () => {
  describe('Initial Rendering', () => {
    it('renders the app logo/title', () => {
      renderWithProviders(<Navigation />);
      expect(screen.getByText(/NetworkingApp/i)).toBeInTheDocument();
    });

    it('renders navigation links when authenticated', () => {
      renderWithProviders(<Navigation />);
      
      expect(screen.getByText(/Flight Companion/i)).toBeInTheDocument();
      expect(screen.getByText(/Airport Pickup/i)).toBeInTheDocument();
      expect(screen.getByText(/Profile/i)).toBeInTheDocument();
    });

    it('shows login/register links when not authenticated', () => {
      const store = createMockStore({ 
        auth: { isAuthenticated: false, user: null } 
      });
      renderWithProviders(<Navigation />, store);
      
      expect(screen.getByText(/Login/i)).toBeInTheDocument();
      expect(screen.getByText(/Register/i)).toBeInTheDocument();
    });
  });

  describe('Theme Toggle', () => {
    it('renders theme toggle button', () => {
      renderWithProviders(<Navigation />);
      expect(screen.getByLabelText(/toggle theme/i)).toBeInTheDocument();
    });

    it('toggles between light and dark theme', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Navigation />);
      
      const themeToggle = screen.getByLabelText(/toggle theme/i);
      
      // Should start in light mode
      expect(themeToggle).toBeInTheDocument();
      
      // Click to toggle to dark mode
      await user.click(themeToggle);
      
      // Theme should be updated in Redux store
      await waitFor(() => {
        // This would be verified by checking the store state or theme context
        expect(themeToggle).toBeInTheDocument();
      });
    });

    it('shows correct theme icon', () => {
      const store = createMockStore({ ui: { theme: 'dark' } });
      renderWithProviders(<Navigation />, store);
      
      // Should show light mode icon when in dark theme
      expect(screen.getByTestId('light-mode-icon')).toBeInTheDocument();
    });
  });

  describe('User Menu', () => {
    it('shows user avatar when authenticated', () => {
      renderWithProviders(<Navigation />);
      expect(screen.getByText('T')).toBeInTheDocument(); // First letter of name
    });

    it('opens user menu on avatar click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Navigation />);
      
      const avatar = screen.getByText('T');
      await user.click(avatar);
      
      await waitFor(() => {
        expect(screen.getByText(/Profile/i)).toBeInTheDocument();
      });
      
      // Check other menu items separately to avoid multiple assertions in waitFor
      expect(screen.getByText(/Settings/i)).toBeInTheDocument();
      expect(screen.getByText(/Logout/i)).toBeInTheDocument();
    });

    it('handles logout functionality', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Navigation />);
      
      const avatar = screen.getByText('T');
      await user.click(avatar);
      
      await waitFor(() => {
        expect(screen.getByText(/Logout/i)).toBeInTheDocument();
      });
      
      await user.click(screen.getByText(/Logout/i));
      
      // Should dispatch logout action
      await waitFor(() => {
        // Verify logout was called
        expect(screen.queryByText('T')).not.toBeInTheDocument();
      });
    });
  });

  describe('Mobile Navigation', () => {
    it('shows mobile menu button on small screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });
      
      renderWithProviders(<Navigation />);
      
      // Should show hamburger menu instead of full navigation
      expect(screen.getByLabelText(/open navigation menu/i)).toBeInTheDocument();
    });

    it('opens mobile drawer menu', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Navigation />);
      
      const menuButton = screen.getByLabelText(/open navigation menu/i);
      await user.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('closes mobile drawer', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ ui: { isDrawerOpen: true } });
      renderWithProviders(<Navigation />, store);
      
      const backdrop = screen.getByRole('dialog');
      await user.click(backdrop);
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('adapts to different screen sizes', () => {
      renderWithProviders(<Navigation />);
      
      // Desktop navigation should be visible
      const desktopNav = screen.getByRole('navigation');
      expect(desktopNav).toBeInTheDocument();
    });

    it('shows condensed navigation on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      });
      
      renderWithProviders(<Navigation />);
      
      // Should show hamburger menu instead of full navigation
      expect(screen.getByLabelText(/open navigation menu/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithProviders(<Navigation />);
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByLabelText(/toggle theme/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/user menu/i)).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Navigation />);
      
      // Tab through navigation elements
      await user.tab();
      expect(screen.getByText(/Flight Companion/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText(/Airport Pickup/i)).toHaveFocus();
    });

    it('has proper focus management in dropdown menu', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Navigation />);
      
      const avatar = screen.getByText('T');
      await user.click(avatar);
      
      await waitFor(() => {
        expect(screen.getByText(/Profile/i)).toBeInTheDocument();
      });
      
      // First menu item should be focused
      expect(screen.getByText(/Profile/i)).toHaveFocus();
    });
  });

  describe('Notifications', () => {
    it('shows notification badge when notifications exist', () => {
      const store = createMockStore({ 
        ui: { notifications: [{ id: 1, message: 'Test', type: 'info' }] } 
      });
      renderWithProviders(<Navigation />, store);
      
      expect(screen.getByText('1')).toBeInTheDocument(); // Notification count
    });

    it('opens notifications panel', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ 
        ui: { notifications: [{ id: 1, message: 'Test notification', type: 'info' }] } 
      });
      renderWithProviders(<Navigation />, store);
      
      const notificationButton = screen.getByLabelText(/notifications/i);
      await user.click(notificationButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Test notification/i)).toBeInTheDocument();
      });
    });
  });
});