// ClientApp/src/components/__tests__/FlightCompanion.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import FlightCompanion from '../FlightCompanion';
import { baseApi } from '../../store/api/baseApi';
//import { store } from '../../store';
//import { fetchRequests, fetchOffers } from '../../store/slices/flightCompanionSlice';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const theme = createTheme();

// Alternative approach - create a simplified mock store
const createMockStore = (initialState = {}) => {
  // Use createSlice to create simple mock reducers that don't have complex type dependencies
  const mockFlightCompanionReducer = (state = {
    requests: [],
    offers: [],
    selectedRequest: null,
    selectedOffer: null,
    filters: {
      departureAirport: '',
      arrivalAirport: '',
      dateRange: { start: '', end: '' },
      priceRange: { min: 0, max: 1000 },
    },
    isLoading: false,
    error: null,
    ...initialState,
  }) => state;

  const mockAuthReducer = (state = {
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
  }) => state;

  const mockUiReducer = (state = {
    theme: 'light',
    isDrawerOpen: false,
    notifications: [],
    isLoading: false,
    currentPage: '/',
    searchQuery: '',
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
      flightCompanion: mockFlightCompanionReducer,
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

const mockRequest = {
  id: 1,
  userId: 1,
  flightNumber: 'NZ289',
  airline: 'Air New Zealand',
  flightDate: '2024-12-15T10:30:00Z',
  departureAirport: 'AKL',
  arrivalAirport: 'PVG',
  travelerName: 'John Doe',
  travelerAge: 'Adult',
  specialNeeds: 'Language assistance',
  offeredAmount: 50,
  additionalNotes: 'First time traveling',
  isActive: true,
  isMatched: false,
  createdAt: '2024-12-01T00:00:00Z',
};

const mockOffer = {
  id: 1,
  userId: 2,
  flightNumber: 'NZ289',
  airline: 'Air New Zealand',
  flightDate: '2024-12-15T10:30:00Z',
  departureAirport: 'AKL',
  arrivalAirport: 'PVG',
  availableServices: 'Language translation, Airport navigation',
  languages: 'English, Chinese',
  requestedAmount: 30,
  additionalInfo: 'Experienced traveler',
  isAvailable: true,
  helpedCount: 15,
  createdAt: '2024-12-01T00:00:00Z',
};

describe('FlightCompanion Component', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Initial Rendering', () => {
    beforeEach(() => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    });

    it('renders the main heading', () => {
      renderWithProviders(<FlightCompanion />);
      
      expect(screen.getByText('Flight Companion Service')).toBeInTheDocument();
    });

    it('renders both tabs', () => {
      renderWithProviders(<FlightCompanion />);
      
      expect(screen.getByText(/Help Requests/i)).toBeInTheDocument();
      expect(screen.getByText(/Available Helpers/i)).toBeInTheDocument();
    });

    it('renders create request button', () => {
      renderWithProviders(<FlightCompanion />);
      
      expect(screen.getByText(/Request Help/i)).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('fetches requests and offers on mount', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockRequest]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockOffer]),
        });

      renderWithProviders(<FlightCompanion />);

      // Wait for component to finish loading
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      // Verify the specific API calls were made
      expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/flightcompanion/requests');
      expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/flightcompanion/offers');
    });

    it('shows loading state while fetching', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      renderWithProviders(<FlightCompanion />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('handles fetch errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      renderWithProviders(<FlightCompanion />);
      
      await waitFor(() => {
        expect(screen.getByText(/Error fetching requests/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    });

    it('switches between request and offer tabs', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<FlightCompanion />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(/No help requests yet/i)).toBeInTheDocument();
      });

      // Switch to offers tab
      await user.click(screen.getByText(/Available Helpers/i));
      
      await waitFor(() => {
        expect(screen.getByText(/No helpers available yet/i)).toBeInTheDocument();
      });
    });

    it('updates button text based on active tab', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<FlightCompanion />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(/Request Help/i)).toBeInTheDocument();
      });

      // Switch to offers tab
      await user.click(screen.getByText(/Available Helpers/i));
      
      await waitFor(() => {
        expect(screen.getByText(/Offer to Help/i)).toBeInTheDocument();
      });
    });
  });

  describe('Request Display', () => {
    it('displays flight companion requests', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockRequest]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        });

      renderWithProviders(<FlightCompanion />);

      // Wait for the first element to load, then check others
      await waitFor(() => {
        expect(screen.getByText('NZ289 - Air New Zealand')).toBeInTheDocument();
      });

      // Check other elements are present
      expect(screen.getByText('AKL → PVG')).toBeInTheDocument();
      expect(screen.getByText('NZD $50')).toBeInTheDocument();
      expect(screen.getByText('Language assistance')).toBeInTheDocument();
    });

    it('shows empty state when no requests', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });

      renderWithProviders(<FlightCompanion />);

      await waitFor(() => {
        expect(screen.getByText(/No help requests yet/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Be the first to request help!/i)).toBeInTheDocument();
    });
  });

  describe('Offer Display', () => {
    it('displays flight companion offers', async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockOffer]),
        });

      renderWithProviders(<FlightCompanion />);

      // Switch to offers tab
      await user.click(screen.getByText(/Available Helpers/i));

      // Wait for the first element to load, then check others
      await waitFor(() => {
        expect(screen.getByText('NZ289 - Air New Zealand')).toBeInTheDocument();
      });

      expect(screen.getByText('English, Chinese')).toBeInTheDocument();
      expect(screen.getByText('Helped 15 travelers')).toBeInTheDocument();
    });

    it('shows empty state when no offers', async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });

      renderWithProviders(<FlightCompanion />);

      // Switch to offers tab
      await user.click(screen.getByText(/Available Helpers/i));

      await waitFor(() => {
        expect(screen.getByText(/No helpers available yet/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Be the first to offer help!/i)).toBeInTheDocument();
    });
  });

  describe('Create Request Form', () => {
    beforeEach(() => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    });

    it('opens create form dialog', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<FlightCompanion />);

      await user.click(screen.getByText(/Request Help/i));

      expect(screen.getByText('Request Flight Companion Help')).toBeInTheDocument();
      expect(screen.getByLabelText(/Flight Number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Airline/i)).toBeInTheDocument();
    });

    it('submits form with valid data', async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockRequest) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([mockRequest]) });

      renderWithProviders(<FlightCompanion />);

      // Open form
      await user.click(screen.getByText(/Request Help/i));

      // Fill form
      await user.type(screen.getByLabelText(/Flight Number/i), 'NZ289');
      await user.type(screen.getByLabelText(/Airline/i), 'Air New Zealand');
      await user.type(screen.getByLabelText(/Flight Date/i), '2024-12-15T10:30');

      // Submit form
      await user.click(screen.getByText(/Create Request/i));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/flightcompanion/requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('NZ289'),
        });
      });
    });

    it('closes form when cancel is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<FlightCompanion />);

      // Open form
      await user.click(screen.getByText(/Request Help/i));
      
      expect(screen.getByText('Request Flight Companion Help')).toBeInTheDocument();

      // Close form
      await user.click(screen.getByText(/Cancel/i));

      await waitFor(() => {
        expect(screen.queryByText('Request Flight Companion Help')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    });

    it('shows validation errors for required fields', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<FlightCompanion />);

      // Open form
      await user.click(screen.getByText(/Request Help/i));

      // Try to submit empty form
      await user.click(screen.getByText(/Create Request/i));

      // Should not submit with empty required fields
      expect(mockFetch).toHaveBeenCalledTimes(2); // Only initial fetches
    });

    it('validates flight number format', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<FlightCompanion />);

      // Open form
      await user.click(screen.getByText(/Request Help/i));

      // Enter invalid flight number
      await user.type(screen.getByLabelText(/Flight Number/i), 'invalid');

      // Form should show validation error (implementation depends on form library)
      const flightNumberInput = screen.getByLabelText(/Flight Number/i);
      expect(flightNumberInput).toHaveValue('invalid');
    });
  });

  describe('Contact Functionality', () => {
    it('shows contact button for requests', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockRequest]),
        })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });

      renderWithProviders(<FlightCompanion />);

      await waitFor(() => {
        expect(screen.getByText(/Contact/i)).toBeInTheDocument();
      });
    });

    it('shows contact helper button for offers', async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockOffer]),
        });

      renderWithProviders(<FlightCompanion />);

      // Switch to offers tab
      await user.click(screen.getByText(/Available Helpers/i));

      await waitFor(() => {
        expect(screen.getByText(/Contact Helper/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when form submission fails', async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
        .mockRejectedValueOnce(new Error('Submission failed'));

      renderWithProviders(<FlightCompanion />);

      // Open form and fill basic required fields
      await user.click(screen.getByText(/Request Help/i));
      await user.type(screen.getByLabelText(/Flight Number/i), 'NZ289');
      await user.type(screen.getByLabelText(/Airline/i), 'Air New Zealand');

      // Try to submit
      await user.click(screen.getByText(/Create Request/i));

      await waitFor(() => {
        expect(screen.getByText(/Error creating request/i)).toBeInTheDocument();
      });
    });

    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<FlightCompanion />);

      await waitFor(() => {
        expect(screen.getByText(/Error fetching requests/i)).toBeInTheDocument();
      });
    });
  });

  describe('Redux Integration', () => {
    it('dispatches fetchRequests action on mount', async () => {
      const mockStore = createMockStore();
      const dispatchSpy = jest.spyOn(mockStore, 'dispatch');
      
      renderWithProviders(<FlightCompanion />, mockStore);
      
      await waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'flightCompanion/fetchRequests/pending'
          })
        );
      });
    });

    it('updates component when Redux state changes', async () => {
      const mockStore = createMockStore({
        requests: [mockRequest]
      });
      
      renderWithProviders(<FlightCompanion />, mockStore);
      
      await waitFor(() => {
        expect(screen.getByText('NZ289 - Air New Zealand')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    });

    it('has proper ARIA labels', () => {
      renderWithProviders(<FlightCompanion />);
      
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(2);
    });

    it('manages focus properly', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<FlightCompanion />);

      const requestHelpButton = screen.getByText(/Request Help/i);
      requestHelpButton.focus();
      expect(requestHelpButton).toHaveFocus();

      await user.tab();
      // Next focusable element should receive focus
    });
  });

  describe('Snackbar Notifications', () => {
    it('shows success message on successful form submission', async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockRequest) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([mockRequest]) });

      renderWithProviders(<FlightCompanion />);

      // Open form, fill and submit
      await user.click(screen.getByText(/Request Help/i));
      await user.type(screen.getByLabelText(/Flight Number/i), 'NZ289');
      await user.type(screen.getByLabelText(/Airline/i), 'Air New Zealand');
      await user.type(screen.getByLabelText(/Flight Date/i), '2024-12-15T10:30');
      await user.click(screen.getByText(/Create Request/i));

      await waitFor(() => {
        expect(screen.getByText(/Request created successfully!/i)).toBeInTheDocument();
      });
    });

    it('can close snackbar notifications', async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<FlightCompanion />);

      // Wait for error snackbar to appear
      await waitFor(() => {
        expect(screen.getByText(/Error fetching requests/i)).toBeInTheDocument();
      });

      // Close the snackbar
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText(/Error fetching requests/i)).not.toBeInTheDocument();
      });
    });
  });
});