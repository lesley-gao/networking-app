import React from 'react';
import { render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Pickup from '../Pickup';
import { PickupState } from '../../store/slices/pickupSlice';
import { AuthState } from '../../store/slices/authSlice';
import  { UIState } from '../../store/slices/uiSlice';
import { baseApi } from '../../store/api/baseApi';

const theme = createTheme();

// Define proper types for mock initial state
interface MockInitialState {
  pickup?: Partial<PickupState>;
  auth?: Partial<AuthState>;
  ui?: Partial<UIState>;
}

const createMockStore = (initialState: MockInitialState = {}) => {
  // Create simple mock reducers without complex typing issues
  const mockPickupReducer = (state = {
    requests: [],
    offers: [],
    isLoading: false,
    error: null,
    ...initialState.pickup,
  }) => state;

  const mockAuthReducer = (state = {
    user: {
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '+64 21 123 4567',
      preferredLanguage: 'English',
      isVerified: true,
      emergencyContact: 'Emergency Contact',
      emergencyPhone: '+64 21 987 6543',
      profilePicture: undefined,
      rating: 4.5,
      totalRatings: 10,
    },
    token: 'mock-jwt-token',
    isAuthenticated: true,
    isLoading: false,
    error: null,
    ...initialState.auth,
  }) => state;

  const mockUiReducer = (state = {
    theme: 'light',
    isDrawerOpen: false,
    notifications: [],
    isLoading: false,
    currentPage: '/',
    searchQuery: '',
    ...initialState.ui,
  }) => state;

  const mockApiReducer = (state = {
    queries: {},
    mutations: {},
    provided: {},
    subscriptions: {},
    config: { online: true, focused: true, middlewareRegistered: true },
  }) => state;

  return configureStore({
    reducer: {
      pickup: mockPickupReducer,
      auth: mockAuthReducer,
      ui: mockUiReducer,
      [baseApi.reducerPath]: mockApiReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // Disable for tests
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

const mockPickupRequest = {
  id: 1,
  userId: 1,
  airport: 'AKL',
  flightNumber: 'NZ001',
  arrivalDate: '2024-12-15T14:30:00Z',
  passengerCount: 2,
  luggageCount: 3,
  destination: 'Auckland CBD',
  contactInfo: '+64 21 123 4567',
  additionalNotes: 'Need child seat',
  offeredAmount: 25,
  isActive: true,
  isMatched: false,
  createdAt: '2024-12-01T00:00:00Z',
};

const mockPickupOffer = {
  id: 1,
  userId: 2,
  airport: 'AKL',
  vehicleType: 'SUV',
  maxPassengers: 4,
  maxLuggage: 5,
  serviceAreas: 'Auckland CBD, North Shore',
  vehicleFeatures: 'Child seat available, WiFi',
  requestedAmount: 20,
  additionalInfo: 'Experienced driver',
  isAvailable: true,
  completedRides: 50,
  createdAt: '2024-12-01T00:00:00Z',
};

describe('Pickup Component', () => {
  describe('Initial Rendering', () => {
    it('renders the main heading', () => {
      renderWithProviders(<Pickup />);
      expect(screen.getByText(/Airport Pickup Services/i)).toBeInTheDocument();
    });

    it('renders both tabs', () => {
      renderWithProviders(<Pickup />);
      expect(screen.getByText(/Pickup Requests/i)).toBeInTheDocument();
      expect(screen.getByText(/Available Drivers/i)).toBeInTheDocument();
    });

    it('renders create request button', () => {
      renderWithProviders(<Pickup />);
      expect(screen.getByText(/Request Pickup/i)).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('switches between request and offer tabs', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Pickup />);

      // Should start on requests tab
      expect(screen.getByText(/No pickup requests yet/i)).toBeInTheDocument();

      // Switch to offers tab
      await user.click(screen.getByText(/Available Drivers/i));
      
      await waitFor(() => {
        expect(screen.getByText(/No drivers available yet/i)).toBeInTheDocument();
      });
    });

    it('updates button text based on active tab', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Pickup />);

      // Should start with "Request Pickup"
      expect(screen.getByText(/Request Pickup/i)).toBeInTheDocument();

      // Switch to offers tab
      await user.click(screen.getByText(/Available Drivers/i));
      
      await waitFor(() => {
        expect(screen.getByText(/Offer Pickup Service/i)).toBeInTheDocument();
      });
    });
  });

  describe('Request Display', () => {
    it('displays pickup requests', async () => {
      const store = createMockStore({
        pickup: { requests: [mockPickupRequest] }
      });
      
      renderWithProviders(<Pickup />, store);
      
      await waitFor(() => {
        expect(screen.getByText('NZ001')).toBeInTheDocument();
      });
      
      // Check other elements separately to avoid multiple assertions in waitFor
      expect(screen.getByText('Auckland CBD')).toBeInTheDocument();
      expect(screen.getByText('2 passengers')).toBeInTheDocument();
      expect(screen.getByText('$25')).toBeInTheDocument();
    });

    it('shows empty state when no requests', () => {
      renderWithProviders(<Pickup />);
      expect(screen.getByText(/No pickup requests yet/i)).toBeInTheDocument();
    });
  });

  describe('Offer Display', () => {
    it('displays pickup offers', async () => {
      const user = userEvent.setup();
      const store = createMockStore({
        pickup: { offers: [mockPickupOffer] }
      });
      
      renderWithProviders(<Pickup />, store);
      
      // Switch to offers tab
      await user.click(screen.getByText(/Available Drivers/i));
      
      await waitFor(() => {
        expect(screen.getByText('SUV')).toBeInTheDocument();
      });
      
      // Check other elements separately to avoid multiple assertions in waitFor
      expect(screen.getByText('4 passengers max')).toBeInTheDocument();
      expect(screen.getByText('50 completed rides')).toBeInTheDocument();
      expect(screen.getByText('$20')).toBeInTheDocument();
    });
  });

  describe('Form Functionality', () => {
    it('opens create request form', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Pickup />);
      
      await user.click(screen.getByText(/Request Pickup/i));
      
      await waitFor(() => {
        expect(screen.getByText(/Create Pickup Request/i)).toBeInTheDocument();
      });
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Pickup />);
      
      await user.click(screen.getByText(/Request Pickup/i));
      
      await waitFor(() => {
        expect(screen.getByText(/Create Pickup Request/i)).toBeInTheDocument();
      });

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Flight number is required/i)).toBeInTheDocument();
      });
      
      // Check other validation messages separately
      expect(screen.getByText(/Destination is required/i)).toBeInTheDocument();
    });

    it('submits valid form data', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Pickup />);
      
      await user.click(screen.getByText(/Request Pickup/i));
      
      await waitFor(() => {
        expect(screen.getByText(/Create Pickup Request/i)).toBeInTheDocument();
      });

      // Fill form
      await user.type(screen.getByLabelText(/Flight Number/i), 'NZ123');
      await user.type(screen.getByLabelText(/Destination/i), 'Auckland CBD');
      await user.selectOptions(screen.getByLabelText(/Passengers/i), '2');
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      // Should close form and show success message
      await waitFor(() => {
        expect(screen.queryByText(/Create Pickup Request/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner when fetching data', () => {
      const store = createMockStore({ 
        pickup: { isLoading: true } 
      });
      renderWithProviders(<Pickup />, store);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error messages', () => {
      const store = createMockStore({ 
        pickup: { error: 'Failed to load pickup data' } 
      });
      renderWithProviders(<Pickup />, store);
      
      expect(screen.getByText(/Failed to load pickup data/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithProviders(<Pickup />);
      
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
      expect(screen.getByLabelText(/Create new pickup request/i)).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Pickup />);
      
      // Tab navigation should work
      await user.tab();
      expect(screen.getByText(/Pickup Requests/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText(/Available Drivers/i)).toHaveFocus();
    });
  });
});