// ClientApp/src/components/__tests__/UserProfile.test.tsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import UserProfile from '../UserProfile';
import authSlice from '../../store/slices/authSlice';
import uiSlice from '../../store/slices/uiSlice';

const theme = createTheme();

const createMockStore = (initialAuthState = {}) => {
  const mockState = {
    auth: {
      user: {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+64 21 123 4567',
        preferredLanguage: 'English',
        emergencyContact: 'Emergency Contact',
        emergencyPhone: '+64 21 987 6543',
        isVerified: true,
        profilePicture: undefined, // Changed from null to undefined
        ...initialAuthState,
      },
      token: 'mock-jwt-token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    },
    ui: {
      theme: 'light' as const,
      isDrawerOpen: false,
      notifications: [],
      isLoading: false,
      currentPage: '/',
      searchQuery: '',
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

describe('UserProfile Component', () => {
  describe('Initial Rendering', () => {
    it('renders user profile heading', () => {
      renderWithProviders(<UserProfile />);
      expect(screen.getByText(/User Profile/i)).toBeInTheDocument();
    });

    it('displays user information', () => {
      renderWithProviders(<UserProfile />);
      
      expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
      expect(screen.getByDisplayValue('User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+64 21 123 4567')).toBeInTheDocument();
    });

    it('shows verification status', () => {
      renderWithProviders(<UserProfile />);
      expect(screen.getByText(/Verified/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates email format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      
      const emailInput = screen.getByDisplayValue('test@example.com');
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');
      
      fireEvent.blur(emailInput);
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument();
      });
    });

    it('validates phone number format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      
      const phoneInput = screen.getByDisplayValue('+64 21 123 4567');
      await user.clear(phoneInput);
      await user.type(phoneInput, '123');
      
      fireEvent.blur(phoneInput);
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid phone number/i)).toBeInTheDocument();
      });
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      
      const firstNameInput = screen.getByDisplayValue('Test');
      await user.clear(firstNameInput);
      
      fireEvent.blur(firstNameInput);
      
      await waitFor(() => {
        expect(screen.getByText(/First name is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits valid profile updates', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      
      const firstNameInput = screen.getByDisplayValue('Test');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Updated Name');
      
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Profile updated successfully/i)).toBeInTheDocument();
      });
    });

    it('handles submission errors', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ error: 'Update failed' });
      renderWithProviders(<UserProfile />, store);
      
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Update failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Emergency Contact', () => {
    it('displays emergency contact information', () => {
      renderWithProviders(<UserProfile />);
      
      expect(screen.getByDisplayValue('Emergency Contact')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+64 21 987 6543')).toBeInTheDocument();
    });

    it('validates emergency contact fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      
      const emergencyNameInput = screen.getByDisplayValue('Emergency Contact');
      await user.clear(emergencyNameInput);
      
      fireEvent.blur(emergencyNameInput);
      
      await waitFor(() => {
        expect(screen.getByText(/Emergency contact name is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Profile Picture', () => {
    it('shows upload profile picture option', () => {
      renderWithProviders(<UserProfile />);
      expect(screen.getByText(/Upload Profile Picture/i)).toBeInTheDocument();
    });

    it('handles file upload', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      
      const file = new File(['test'], 'profile.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/upload profile picture/i) as HTMLInputElement;
      
      await user.upload(fileInput, file);
      
      expect(fileInput.files![0]).toBe(file);
    });
  });

  describe('Loading States', () => {
    it('shows loading state when updating', () => {
      const store = createMockStore({ isLoading: true });
      renderWithProviders(<UserProfile />, store);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('disables form during loading', () => {
      const store = createMockStore({ isLoading: true });
      renderWithProviders(<UserProfile />, store);
      
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      renderWithProviders(<UserProfile />);
      
      expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserProfile />);
      
      await user.tab();
      expect(screen.getByDisplayValue('Test')).toHaveFocus();
    });
  });
});