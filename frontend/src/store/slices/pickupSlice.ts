import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { PickupFilters } from '../../components/filters/AdvancedSearchFilters';

export interface PickupState {
  requests: any[];
  offers: any[];
  filters: PickupFilters;
  isLoading: boolean;
  error: string | null;
}

const initialState: PickupState = {
  requests: [],
  offers: [],
  filters: {
    airport: '',
    dateRange: {
      start: '',
      end: '',
    },
    priceRange: {
      min: 0,
      max: 200,
    },
    passengerCount: undefined,
    vehicleType: '',
    hasLuggage: undefined,
    serviceArea: '',
    searchText: '',
  },
  isLoading: false,
  error: null,
};

const pickupSlice = createSlice({
  name: 'pickup',
  initialState,
  reducers: {
    updateFilters: (state, action: PayloadAction<Partial<PickupFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { updateFilters, clearFilters, clearError } = pickupSlice.actions;
export default pickupSlice.reducer;