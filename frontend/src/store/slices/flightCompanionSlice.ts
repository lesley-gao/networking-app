import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface FlightCompanionRequest {
  id: number;
  userId: number;
  flightNumber: string;
  airline: string;
  flightDate: string;
  departureAirport: string;
  arrivalAirport: string;
  travelerName: string;
  travelerAge: string;
  specialNeeds: string;
  offeredAmount: number;
  additionalNotes: string;
  isActive: boolean;
  isMatched: boolean;
  createdAt: string;
}

export interface FlightCompanionOffer {
  id: number;
  userId: number;
  flightNumber: string;
  airline: string;
  flightDate: string;
  departureAirport: string;
  arrivalAirport: string;
  availableServices: string;
  languages: string;
  requestedAmount: number;
  additionalInfo: string;
  isAvailable: boolean;
  helpedCount: number;
  createdAt: string;
}

export interface FlightCompanionState {
  requests: FlightCompanionRequest[];
  offers: FlightCompanionOffer[];
  selectedRequest: FlightCompanionRequest | null;
  selectedOffer: FlightCompanionOffer | null;
  filters: {
    departureAirport: string;
    arrivalAirport: string;
    dateRange: {
      start: string;
      end: string;
    };
    priceRange: {
      min: number;
      max: number;
    };
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: FlightCompanionState = {
  requests: [],
  offers: [],
  selectedRequest: null,
  selectedOffer: null,
  filters: {
    departureAirport: '',
    arrivalAirport: '',
    dateRange: {
      start: '',
      end: '',
    },
    priceRange: {
      min: 0,
      max: 1000,
    },
  },
  isLoading: false,
  error: null,
};

// Async Thunks
export const fetchRequests = createAsyncThunk(
  'flightCompanion/fetchRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/flightcompanion/requests');
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      const data = await response.json();
      return data as FlightCompanionRequest[];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const fetchOffers = createAsyncThunk(
  'flightCompanion/fetchOffers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/flightcompanion/offers');
      if (!response.ok) {
        throw new Error('Failed to fetch offers');
      }
      const data = await response.json();
      return data as FlightCompanionOffer[];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const createRequest = createAsyncThunk(
  'flightCompanion/createRequest',
  async (requestData: Omit<FlightCompanionRequest, 'id' | 'isActive' | 'isMatched' | 'createdAt'>, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/flightcompanion/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create request');
      }
      
      const data = await response.json();
      return data as FlightCompanionRequest;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const createOffer = createAsyncThunk(
  'flightCompanion/createOffer',
  async (offerData: Omit<FlightCompanionOffer, 'id' | 'isAvailable' | 'createdAt'>, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/flightcompanion/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(offerData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create offer');
      }
      
      const data = await response.json();
      return data as FlightCompanionOffer;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// Slice
const flightCompanionSlice = createSlice({
  name: 'flightCompanion',
  initialState,
  reducers: {
    setSelectedRequest: (state, action: PayloadAction<FlightCompanionRequest | null>) => {
      state.selectedRequest = action.payload;
    },
    setSelectedOffer: (state, action: PayloadAction<FlightCompanionOffer | null>) => {
      state.selectedOffer = action.payload;
    },
    updateFilters: (state, action: PayloadAction<Partial<FlightCompanionState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Requests
    builder
      .addCase(fetchRequests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.requests = action.payload;
      })
      .addCase(fetchRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
    
    // Fetch Offers
      .addCase(fetchOffers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOffers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.offers = action.payload;
      })
      .addCase(fetchOffers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
    
    // Create Request
      .addCase(createRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.requests.push(action.payload);
      })
      .addCase(createRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
    
    // Create Offer
      .addCase(createOffer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOffer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.offers.push(action.payload);
      })
      .addCase(createOffer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { setSelectedRequest, setSelectedOffer, updateFilters, clearError } = flightCompanionSlice.actions;

// Export reducer
export default flightCompanionSlice.reducer;